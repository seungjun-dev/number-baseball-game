# 온라인 1:1 대전 설계 (Supabase)

> 상태: 백엔드 + 앱 화면 구현 완료 (2026-10-31) — 서버 `supabase/`, 앱 `src/features/{player,stats,match}`.

## 1. 전체 구조

```
[앱 (React, WebView)]
   │  supabase-js
   ├─ Auth ────────── 익명 로그인 → (추후) 카카오/구글 계정 연결
   ├─ RPC (Postgres 함수) ─ 매칭, 비밀 숫자 설정, 투구 판정  ← 서버 권위(server-authoritative)
   ├─ Realtime ─────── 경기 상태·투구 변경 구독, Presence(접속 여부)
   └─ REST (select) ── 프로필, 전적 조회 (RLS로 보호)
[Supabase]
   Postgres + RLS + pg_cron(오래된 대기열/방 정리)
   Edge Functions — 지금은 사용 안 함. 푸시 알림·외부 연동이 생기면 도입
```

### 왜 판정을 Postgres 함수(RPC)에서 하나
- 비밀 숫자가 DB 밖으로 나가지 않는다 (앱이 볼 수 없는 테이블에 저장).
- 매칭·투구 처리를 **한 트랜잭션**으로 원자적으로 처리할 수 있다 (동시 투구, 동시 매칭 경합 방지).
- Edge Function 대비 콜드 스타트가 없고 왕복이 1회 적다.
- 단점: 판정 로직이 TS(`features/game/logic`)와 SQL에 이중으로 존재 → 규칙 예시(정답 3647) 케이스를 pgTAP 테스트(`supabase test db`)로 동일하게 검증해 차이를 막는다.

## 2. 데이터 모델

| 테이블 | 용도 | 앱에서 접근 (RLS) |
| --- | --- | --- |
| `profiles` | 플레이어 (id = auth.users.id, 닉네임, 아바타) | 모두 읽기 / 본인만 수정 |
| `matches` | 경기 (mode: `invite`·`random`, status, 현재 차례, 승자, 초대 코드, 타임스탬프) | 참가자만 읽기 / 쓰기는 RPC만 |
| `match_players` | 경기 참가자 (match_id, user_id, seat 1·2, ready 여부) | 참가자만 읽기 |
| `match_secrets` | 각자의 비밀 숫자 | **접근 불가** (정책 없음, RPC만 사용) |
| `guesses` | 투구 기록 (match_id, user_id, 순번, 추측, strike, ball) | 참가자만 읽기 / 쓰기는 RPC만 |
| `matchmaking_queue` | 랜덤 매칭 대기열 (user_id, enqueued_at, last_seen_at) | 본인 행만 읽기·삭제 |
| `solo_games` | 싱글 플레이 기록 (투구 수, 승패) — 클라이언트 보고값 | 본인만 읽기 / 쓰기는 RPC만 |

전적은 뷰 대신 `get_player_stats(user_id)` 함수로 계산한다 (RLS로 숨겨진 남의 경기까지 집계해야 하므로).

경기 상태: `waiting`(상대 대기) → `setting`(비밀 숫자 설정) → `playing` → `finished` | `abandoned` | `expired`

## 3. 매칭

### 3-1. 초대 코드
1. `create_invite_match()` → 6자리 코드 생성 (혼동 문자 0/O, 1/I 제외), 10분 후 만료
2. 친구에게 코드 공유 (추후 카카오톡 공유 / 딥링크)
3. `join_invite_match(code)` → 두 번째 자리 채우고 status `setting`으로 전환
4. 방장 앱은 Realtime으로 `matches` 변경을 구독하고 있다가 상대 입장을 즉시 감지

### 3-2. 랜덤 매칭
```
앱 A: enqueue_random_match()
  └ 트랜잭션:
      SELECT … FROM matchmaking_queue
       WHERE user_id <> 나 AND last_seen_at > now() - '20 seconds'
       ORDER BY enqueued_at
       LIMIT 1 FOR UPDATE SKIP LOCKED      ← 동시에 여러 명이 들어와도 한 명과만 짝지어짐
      ├ 찾음  → 상대 행 삭제, matches + match_players 생성, match_id 반환
      └ 없음  → 내 행 INSERT (이미 있으면 갱신), null 반환 → 대기 화면
앱 A(대기 중):
  - match_players 의 내 user_id INSERT 를 Realtime 으로 구독 → 매칭되면 경기 화면으로
  - 10초마다 heartbeat_matchmaking() 으로 last_seen_at 갱신 (앱 종료·백그라운드 감지)
  - 취소 시 cancel_matchmaking() 으로 내 행 삭제
pg_cron (1분마다): last_seen_at 이 오래된 대기열 행, 만료된 초대 방 정리
```
- 대기 30초가 지나면 "초대 코드로 친구와 하기"를 제안 (사용자 적을 때 대비).
- 추후 확장: 실력 기반 매칭(전적의 승률/레이팅 컬럼 추가 후 WHERE 조건에 범위 추가).

## 4. 경기 진행
1. **비밀 숫자 설정**: `set_secret(match_id, secret)` — 검증 후 `match_secrets` 저장, 둘 다 준비되면 `playing` + 선공 랜덤 결정
2. **투구**: `submit_guess(match_id, guess)` — 내 차례인지·형식·중복 검증 → 상대 비밀 숫자로 판정 → `guesses` INSERT → 차례 넘김 / 승패 확정
3. **실시간 반영**: 두 앱 모두 `guesses`, `matches` 의 해당 match_id 변경을 구독 (Realtime은 RLS를 따르므로 참가자만 수신)
4. **접속 끊김**: Realtime Presence로 상대 이탈 감지 → 일정 시간(예: 60초) 미복귀 시 `abandoned` 처리, 남은 사람 승리
5. **투구 제한 시간**: 차례마다 제한 시간(예: 30초) — 초과 시 해당 턴 아웃 처리 (서버 시각 기준, `turn_started_at` 저장)

## 5. 인증과 계정
- 첫 실행 시 `signInAnonymously()` → 닉네임 입력으로 `profiles` 생성 (= "플레이어 만들기")
- 추후 SSO: `linkIdentity({ provider: 'kakao' })` 로 익명 계정에 연결 → 전적 유지
- 익명 계정은 앱 삭제 시 복구 불가 → 전적이 쌓이면 계정 연결 유도 문구 노출

## 6. 앱 코드 구조 (예정)
```
src/lib/supabase/            클라이언트, 환경설정, 생성 타입(database.types.ts)
src/features/player/         플레이어 만들기 (repository + 화면)
src/features/match/          온라인 대전 (매칭 서비스, 실시간 훅, 화면)
src/features/stats/          전적 확인
supabase/migrations/         스키마·RLS·RPC (SQL)
supabase/tests/              pgTAP 테스트 (판정·매칭·RLS)
```
화면 → feature의 service/repository → `getSupabase()` 순서로만 접근한다.

## 7. 확정된 규칙 (2026-10-31)
- [x] **공정성**: 선공이 먼저 맞히면 후공에게 같은 횟수의 마지막 기회. 후공도 맞히면 무승부(`both_solved`), 못 맞히면 선공 승.
      후공이 먼저 맞히면 (선공은 같은 횟수에 이미 실패했으므로) 즉시 후공 승.
- [x] **최대 투구 수**: 각자 9회. 둘 다 못 맞히면 무승부(`max_attempts`).
- [x] **제한 시간**: 턴당 30초 (+네트워크 여유 2초). 초과 시 그 턴은 아웃(`guesses.timed_out`).
      같은 사람이 3턴 연속 시간 초과면 기권패(`timeout_forfeit`).
      시간 초과는 ① 상대가 `claim_timeout` 호출 ② 늦게 온 본인 투구 ③ pg_cron 정리 작업(10초 주기) 중 가장 먼저 처리된다.
- [x] **싱글 플레이 전적**도 서버에 저장 (`record_solo_game`).
- 경기 중 나가기(`leave_match`)는 기권패(`forfeit`). 대기/설정 단계에서 나가면 경기 무효(`expired`, 전적 미반영).
- 비밀 숫자 설정은 60초 안에 둘 다 끝내야 한다. 넘기면 경기 무효.

## 8. RPC 목록 (앱에서 호출)

| 함수 | 반환 | 설명 / 주요 에러 |
| --- | --- | --- |
| `get_active_match()` | uuid \| null | 이어하기용. 진행 중인 내 경기 |
| `create_invite_match()` | `{match_id, invite_code}` | `already_in_match` |
| `join_invite_match(p_code)` | uuid | 대소문자 무시. `invite_not_found`, `cannot_join_own_match`, `already_in_match` |
| `enqueue_random_match()` | uuid \| null | 대기 중엔 **5~10초마다 재호출(heartbeat)**. 매칭되면 경기 id |
| `cancel_matchmaking()` | void | |
| `set_secret(p_match_id, p_secret)` | void | `invalid_number`, `secret_already_set`, `invalid_status` |
| `submit_guess(p_match_id, p_guess)` | `{strike, ball, timed_out}` | `not_your_turn`, `invalid_number`, `invalid_status` |
| `claim_timeout(p_match_id)` | boolean | 상대 턴 마감이 지났을 때 호출 |
| `leave_match(p_match_id)` | void | |
| `record_solo_game(p_attempts, p_won)` | void | `invalid_attempts` |
| `get_player_stats(p_user_id?)` | 전적 1행 | 생략 시 본인 |

공통 에러: `not_authenticated`, `profile_required`(프로필 먼저 생성), `match_not_found`.
프로필은 RPC 없이 `profiles` 테이블에 직접 insert/update (닉네임·아바타 컬럼만 허용).

## 9. Realtime 사용 시 주의
- 채널의 `SUBSCRIBED` 상태 직후에는 DB 변경 스트림이 아직 준비 전일 수 있다.
  `system` 이벤트의 **"Subscribed to PostgreSQL"** 을 받은 뒤에 매칭/경기 RPC를 호출한다.
  (로컬 첫 구독에서 1.5초 대기로는 알림을 놓치는 것을 확인함)
- 알림을 놓쳐도 동작하도록: 랜덤 대기 중에는 `enqueue_random_match()` heartbeat 결과로도 매칭을 감지하고,
  경기 화면은 재연결 시 `matches`/`guesses` 를 다시 조회해 상태를 맞춘다.
- 턴 타이머 표시는 서버의 `turn_started_at` + `turn_seconds` 기준으로 계산한다 (기기 시계 차이 주의).
