# 개발 로그 (DEVLOG)

최신 항목이 위에 오도록 기록합니다.

## 2026-10-31 — 플레이어 만들기 화면 중간 폭 레이아웃 수정
### 변경 사항
- 701~900px 폭에서 시안의 2단 레이아웃(문구 + 입력 박스)의 문구 칸이 좁아져 야구공 그림이 "YOURS." 제목과 겹치던 문제
  → 해당 폭에서는 1단(최대 520px)으로 배치 (`index.css` App additions)

### 테스트
- 브라우저에서 720 / 800 / 920 / 1200px 확인 (겹침 없음), 앱 테스트·build·lint 통과

## 2026-10-31 — 플레이어 만들기 · 전적 확인 · 온라인 1:1 대전 화면
### 변경 사항
- **플레이어 만들기** (`features/player`)
  - 첫 실행 시 익명 로그인 → 닉네임(2~12자)·아바타 선택 화면 (시안의 로그인 화면 레이아웃)
  - 헤더 프로필 칩, 프로필 수정
- **전적 확인** (`features/stats`)
  - 1:1 대전 승/패/무·승률, 싱글 판수·승률·최고 기록, 최근 대전 10경기 (상대·결과·종료 사유)
  - 싱글 경기가 끝나면 서버에 자동 기록 (`useSinglePlayGame` 의 `onGameEnd`)
- **온라인 1:1 대전** (`features/match`)
  - 로비: 랜덤 매칭 / 초대 코드 만들기 / 코드로 참가
  - 랜덤 매칭 대기 화면 (경과 시간, 30초 후 초대 코드 권유, 취소)
  - 초대 대기 화면 (코드 크게 표시, 복사, 만료까지 남은 시간)
  - 비밀 숫자 설정 (상대 준비 상태 실시간 표시, 60초 제한)
  - 경기 화면: 차례·30초 타이머(10초 이하 강조)·마지막 기회 안내, 내 투구/상대 투구 점수판, 나가기 확인(기권패)
  - 결과 화면: YOU WIN / GOOD GAME / DRAW GAME, 종료 사유, 양쪽 투구 기록
  - 앱을 다시 열면 진행 중인 경기 이어하기
  - 턴 마감이 지나면 앱이 시간 초과를 서버에 확정 요청 (`claim_timeout`)
- 공용: `TextField`, `useNow`, 서버 에러 코드 → 한국어 문구(`toUserMessage`), `Scoreboard` 제목 설정 가능
- 서비스 주입 구조 (`app/services.ts`), 서버 미설정 시 기존처럼 싱글 플레이만 노출
- vitest 는 `.env.local` 을 무시하고 항상 오프라인으로 실행

### 버그 수정 (개발 중 발견)
- StrictMode 이중 effect 로 익명 계정이 2개 생성되던 문제 → 진행 중인 로그인 요청 공유

### 테스트
- 앱 테스트 24개 파일 100개 통과 (fake repository/service 주입)
  - 플레이어 생성·수정·에러·재시도, 익명 로그인 중복 방지
  - 전적 화면, 싱글 기록 콜백
  - 매칭 heartbeat·Realtime/heartbeat 매칭 감지·취소, 초대 참가 → 비밀 숫자, 차례 전환·실시간 반영·마지막 기회, 결과, 기권 확인, 시간 초과 확정
- DB 테스트 67개 통과, build·lint 통과
- 브라우저(모바일 375px) + 봇 상대(supabase-js 스크립트)로 실제 검증
  - 플레이어 만들기 → 새로고침 후 유지
  - 싱글 9회 패배 → 전적 반영
  - 랜덤 매칭 → 비밀 숫자 → 실시간 턴 → 정답으로 승리
  - 초대 코드 생성 → 봇 참가 → 기권 → 전적 "1승 1패 · 50%" 및 최근 경기 반영

## 2026-10-31 — 온라인 대전·전적 백엔드 구현 (Supabase)
### 결정 (설계 문서 7장, 추천안 채택)
- 선공이 먼저 맞히면 후공에게 마지막 기회 → 둘 다 맞히면 무승부
- 각자 최대 9회, 둘 다 실패 시 무승부 / 턴 제한 30초(+2초), 3턴 연속 시간 초과 시 기권패
- 싱글 플레이 전적도 서버 저장

### 변경 사항
- Docker Desktop 설치 후 로컬 Supabase 실행 확인
- `supabase/migrations/20261031000001_schema.sql`
  - 테이블: profiles, matches, match_players, match_secrets, guesses, matchmaking_queue, solo_games
  - 모든 테이블 RLS, 쓰기 권한 회수(RPC로만), 비밀 숫자 테이블은 앱 접근 불가, anon 접근 차단
  - profiles 는 닉네임·아바타 컬럼만 본인 수정 허용
  - Realtime publication: matches, match_players, guesses
- `supabase/migrations/20261031000002_match_rpc.sql`
  - 판정/검증(`private.judge`, `private.is_valid_number`) — TS 로직과 동일 규칙
  - 초대 코드 방 생성·참가, 랜덤 매칭(advisory lock 직렬화 + heartbeat + 20초 미응답 제외)
  - 비밀 숫자 설정 → 선공 무작위, 투구 판정, 마지막 기회, 무승부, 시간 초과, 기권
  - 싱글 기록, 전적 조회(`get_player_stats`)
  - pg_cron 10초 주기 정리 작업(만료 방, 오래된 대기열, 턴 시간 초과)
- `src/lib/supabase/database.types.ts` 생성, 클라이언트를 `SupabaseClient<Database>` 로 타입 지정
- 설계 문서에 확정 규칙, RPC 목록, Realtime 주의사항 추가

### 버그 수정 (개발 중 발견)
- 3턴 연속 시간 초과·경기 중 나가기 시 `finish_match` 인자 타입 불일치(integer vs smallint)로 실패하던 문제 → 파라미터를 integer 로 변경

### 테스트
- pgTAP 3개 파일 67개 통과 (`npx supabase test db`)
  - 01_rules: 규칙 예시(정답 3647) 판정, 숫자 검증
  - 02_security: 비밀 숫자 조회 차단, 직접 쓰기 차단, 제3자 조회 차단, anon RPC 차단
  - 03_match_flow: 초대/참가, 무승부·선공승·후공승·최대 횟수, 시간 초과·연속 시간 초과 기권, 기권, 랜덤 매칭·heartbeat·정리·취소, 전적
- supabase-js 실제 API 스모크 테스트: 익명 로그인 → 프로필 → 랜덤 매칭 → Realtime 알림 → 비밀 숫자 → 투구 → 전적 통과
  - Realtime 첫 구독 직후(1.5초) 알림 누락 확인 → "Subscribed to PostgreSQL" 이후 호출하도록 설계 문서에 반영
- pg_cron 정리 작업 등록·실행 성공 확인
- 앱: 전체 테스트, build, lint 통과

## 2026-10-29 — 온라인 대전용 백엔드(Supabase) 개발 환경 세팅
### 결정
- 1:1 대전을 온라인(각자 폰)으로 하기로 결정 → 전적 포함 서버 데이터는 Supabase(BaaS) 사용
  - 선정 이유: 관계형 DB(전적 통계), 무료 플랜에서 서버 로직 가능, 카카오/구글 로그인 기본 지원, 익명 로그인
- 판정·매칭은 Postgres RPC(서버)에서 처리, 비밀 숫자는 앱이 읽을 수 없는 테이블에 저장
- 매칭: 초대 코드 + 랜덤 매칭(대기열 + `FOR UPDATE SKIP LOCKED` + heartbeat + pg_cron 정리)

### 변경 사항
- `supabase` CLI(devDependency), `@supabase/supabase-js` 설치
- `supabase init` → `supabase/config.toml`
  - 익명 로그인 / 수동 계정 연결 활성화, site_url·redirect URL을 Vite(5173)·Capacitor 기준으로 변경
  - 카카오/구글 OAuth 블록 추가 (비활성, 키는 `supabase/.env` 의 env() 참조)
  - 로컬 자원 절약: analytics, storage vector 비활성
- `src/lib/supabase/`: 환경변수 기반 클라이언트(`getSupabase`, 미설정 시 null → 오프라인 동작), `vite-env.d.ts` 환경변수 타입
- `.env.example`, `supabase/.env.example`, `supabase/.gitignore`에 시크릿 파일 추가
- npm 스크립트: `supabase:start|stop|status`, `db:migration`, `db:reset`, `db:types`, `functions:serve`
- 문서: `docs/LOCAL_BACKEND_SETUP.md`(Docker 설치·설정 가이드), `docs/ONLINE_MATCH_DESIGN.md`(대전·매칭 설계)
- `CLAUDE.md`에 백엔드 규칙 추가

### 테스트
- `readSupabaseConfig` 단위 테스트 추가 — 전체 테스트, build, lint 통과
- Docker 미설치로 `supabase start`는 아직 미검증 (config 파싱은 정상 확인)

## 2026-10-28 — 싱글 플레이 숫자야구 게임 구현
### 변경 사항
- 시안(`src/App.tsx`, `src/index.css`)을 원본 그대로 별도 커밋으로 보존한 뒤 모듈 구조로 재구성
- 범위: 싱글 플레이만 구현. SSO 로그인·1:1 대전·프로필 메뉴는 제외 (앱은 홈 화면에서 시작)
- `features/game/logic` (순수 로직)
  - `generateAnswer`: 0~9 중복 없는 4자리 정답 생성 (난수 함수 주입 가능)
  - `judge` / `isOut` / `isWin`: 스트라이크·볼 판정
  - `validateGuess`: 길이·숫자·중복 검사 + 한국어 안내 문구
  - `formatCall`: 시안의 중계 콜 문구 ("2 BALL · 1 STRIKE!", "OUT!")
  - `createGame` / `submitGuess`: 경기 상태 전이 (최대 9회, 맞히면 승리, 다 쓰면 패배)
- `features/game/hooks/useSinglePlayGame`: 투구 연출 단계(swing → miss → call/victory → idle) 타이머 관리, 재시작 시 타이머 정리
- `features/game/components`: `GuessInput`, `Playfield`, `Scoreboard`, `ScoreList`, `GameScreen`, `ResultScreen`, `SinglePlayGame`(경기↔결과 컨테이너)
- `features/home`: `HomeScreen`, 재사용 가능한 `ModeCard` (추후 1:1 대전 카드 추가용)
- 공용 `components`: `AppHeader`, `AppFooter`, `ThemeToggle`, `DigitInputGroup`, `PrimaryButton`, `TextButton`, `Eyebrow`
- 라이트(에디토리얼)/다크(중계) 테마 토글 — `types/theme.ts`
- 시안 대비 보완
  - 입력 시 다음 칸 자동 이동, 빈 칸 Backspace 시 이전 칸 이동, Enter로 투구
  - 중복 숫자 입력 시 안내 문구 표시
  - 연출 중에는 투구 버튼만 막고 입력칸은 유지 (모바일 키보드가 닫히지 않도록)
  - 시안의 타이머가 이전 상태를 참조하던 문제를 상태 전이 로직으로 해결
- `index.css` 하단에 보완 스타일 추가 (`score-list` 리셋, 단일 모드 카드, 안내 문구)

### 버그 수정 (개발 중 발견)
- 이미 채워진 칸에 같은 숫자를 다시 입력하면 onChange가 발생하지 않아 다음 칸으로 넘어가지 않던 문제 → keydown에서 숫자 처리
- 리렌더 전에 입력이 연달아 들어오면 이전 값 기준으로 덮어쓰던 문제 → 최신 값 ref 사용

### 테스트
- 13개 파일, 52개 테스트 통과 / `npm run build`, `npm run lint` 통과
- 규칙의 연습 게임(정답 3647) 시나리오를 로직 단위·컴포넌트 통합 테스트로 재현
- 브라우저(모바일 375px) 수동 확인: 투구 연출, 중복 안내, 9회 소진 후 결과 화면, 다크 모드, 한 판 더 하기

## 2026-10-28 — 개발 환경 세팅
### 변경 사항
- Vite + React 19 + TypeScript 프로젝트 생성 (`create-vite` react-ts 템플릿)
- Vite `base: './'` 설정 (안드로이드 WebView 로컬 로딩 대비)
- Vitest + React Testing Library + jsdom 테스트 환경 구성 (`npm test`, `npm run test:watch`)
- `typecheck` 스크립트 추가
- 템플릿 샘플 코드/에셋 제거, 최소 App 셸("숫자야구" 타이틀)로 교체
- 모듈 구조용 디렉토리 생성: `features/`, `components/`, `hooks/`, `utils/`, `types/`, `test/`
- `index.html`: `lang="ko"`, 모바일 viewport 설정
- `CLAUDE.md`(개발 지침), `DEVLOG.md`(변경 로그) 추가
- Git 저장소 초기화, 원격 저장소 연결 (https://github.com/seungjun-dev/number-baseball-game)

### 테스트
- `App.test.tsx`: 타이틀 렌더링 스모크 테스트
