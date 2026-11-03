# 배포 가이드 — 1단계: 스테이징

목표: 실제 서버(Supabase Cloud) + 웹 주소(Vercel)로 서로 다른 폰끼리 대전해 볼 수 있는 **테스트용 환경**.

```
GitHub (main push)
  ├─ GitHub Actions ─ lint · test · build · DB 테스트 ─▶ (통과 시) 스테이징 DB 마이그레이션 반영
  └─ Vercel ──────── 웹 빌드·배포 ─▶ https://<프로젝트>.vercel.app  (PR 마다 미리보기 주소)
                                           │ supabase-js
                                           ▼
                                Supabase Cloud (staging, 서울 리전)
```

> 가입·결제·비밀번호/토큰 입력은 직접 진행해 주세요. 토큰·비밀번호는 채팅에 붙여넣지 말고 각 서비스 화면에만 입력합니다.

---

## A. Supabase 스테이징 프로젝트 (약 10분)

1. https://supabase.com/dashboard → **New project**
   - Name: `number-baseball-staging`
   - Region: **Northeast Asia (Seoul)**
   - Database Password: 강력한 비밀번호 생성 → **비밀번호 관리자에 저장** (C 단계에서 다시 씀)
2. 생성 후 확인할 값
   - **Project ref**: Project Settings → General (주소창 `.../project/<ref>` 의 `<ref>`)
   - **Project URL**: `https://<ref>.supabase.co`
   - **Publishable key**: Project Settings → API Keys → `sb_publishable_…` (앱에 들어가는 공개용 키)
3. **Authentication → Sign In / Providers → Anonymous sign-ins: 켜기** (로컬은 `config.toml` 로 켜져 있지만 원격은 따로 켜야 함)
4. 처음 한 번은 로컬 터미널에서 DB 구조를 올립니다.
   ⚠️ 반드시 **프로젝트 폴더(`number-baseball-game/`)에서** 실행하세요. 상위 폴더에서 `npx supabase` 를 실행하면
   프로젝트에 설치된 CLI(2.x) 대신 최신 CLI 를 새로 받아 쓰고, 연결 정보도 엉뚱한 폴더에 저장됩니다.

```bash
cd number-baseball-game
```

```bash
npx supabase login
```
브라우저가 열리면 로그인 승인.

```bash
npx supabase link --project-ref <ref>
```
DB 비밀번호를 물으면 1번에서 만든 비밀번호 입력.

```bash
npx supabase db push --linked --dry-run
```
적용될 마이그레이션 목록 확인 (`20261031000001_schema.sql`, `20261031000002_match_rpc.sql`).

```bash
npx supabase db push --linked
```
두 개가 적용되면 성공. (`--linked` 를 붙여 원격 대상임을 명시 — CLI 3.x 는 기본 대상이 로컬 DB)

> 출력에 `migration repair` 를 권하는 메시지가 나와도 실행 위치·대상(`Target:` 줄)을 먼저 확인하세요.

5. 대시보드에서 확인
   - Table Editor: `profiles`, `matches` 등 7개 테이블
   - Integrations → Cron: `number-baseball-sweep` (10초 주기) 활성

> ⚠️ `npx supabase db push --linked` 는 **원격(스테이징) DB**를 바꿉니다. 로컬 초기화(`npm run db:reset`)는 로컬에만 영향.

## B. Vercel 웹 배포 (약 5분)

1. https://vercel.com → **Continue with GitHub** → **Add New… → Project** → `number-baseball-game` Import
2. 설정은 `vercel.json` 이 채워줌 (Framework: Vite, Output: `dist`) — 그대로 둠
3. **Environment Variables** (Production, Preview 모두 체크)

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |

4. **Deploy** → 발급된 주소(예: `https://number-baseball-game.vercel.app`) 접속해 플레이어 만들기 확인
5. Supabase → **Authentication → URL Configuration → Site URL** 에 위 Vercel 주소 입력 (추후 SSO 로그인 리다이렉트용)

이후 `main` 에 push 하면 자동 재배포, PR 을 열면 미리보기 주소가 생깁니다.

## C. GitHub Actions 자동 마이그레이션 (약 5분)

`main` 에 새 마이그레이션이 들어오면 테스트 통과 후 스테이징 DB 에 자동 반영되도록 설정합니다.
(설정 전에도 CI 의 lint·test·build·DB 테스트는 동작하고, 반영 단계만 건너뜁니다.)

> **최소 권한 원칙**: Supabase 액세스 토큰은 계정의 모든 프로젝트(추후 운영 포함)를 관리할 수 있어 CI 에 쓰지 않습니다.
> 대신 **스테이징 DB 하나에만 접근 가능한 접속 주소**만 등록합니다. 유출되더라도 영향 범위가 스테이징 DB 로 한정됩니다.

1. **스테이징 DB 접속 주소 복사**
   - Supabase 대시보드 상단 **Connect** → **Session pooler** 탭의 연결 문자열
     (예: `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`)
   - `[YOUR-PASSWORD]` 를 A-1 의 DB 비밀번호로 바꿉니다.
     비밀번호에 `@ : / ? # %` 같은 특수문자가 있으면 **퍼센트 인코딩** 필요 (예: `@` → `%40`) — 번거로우면 영문·숫자로만 된 비밀번호로 재설정
   - ⚠️ **Direct connection** 주소는 쓰지 마세요. GitHub 실행 환경은 IPv6 를 지원하지 않아 연결이 실패할 수 있습니다.
   - 이 주소는 채팅·코드·문서에 붙여넣지 말고 아래 GitHub 화면에만 입력합니다.
2. GitHub 레포 → **Settings → Environments → New environment** → 이름 `staging`
   - **Deployment branches and tags** → `Selected branches and tags` → `main` 만 추가 (다른 브랜치에서 이 Secret 사용 불가)
   - **Environment secrets** → `SUPABASE_STAGING_DB_URL` = 1번 접속 주소
3. GitHub 레포 → **Settings → Secrets and variables → Actions → Variables 탭 → New repository variable**
   - `SUPABASE_STAGING_PROJECT_REF` = A-2 의 Project ref (자동 반영을 켜는 스위치 역할)
   - (repository variable 이어야 함 — job 실행 조건 `if` 에서 environment 변수는 읽을 수 없음)
4. 확인: 레포 **Actions** 탭 → 다음 `main` push 의 CI 에서 `스테이징 DB 마이그레이션 반영` 단계가 성공
   (반영할 새 마이그레이션이 없으면 "Remote database is up to date" 로 끝나는 것이 정상)

**보안 운영**
- 유출이 의심되면 대시보드 Project Settings → Database → **Reset database password** 후 Secret 교체
- 외부 사람이 올린 PR(포크)에는 GitHub 이 Secret 을 넘기지 않고, 반영 단계는 `main` push 에서만 실행됩니다.
- 운영(production) 프로젝트를 만들 때도 같은 방식으로 `production` 환경 + 별도 접속 주소를 씁니다.

## D. 스테이징 테스트 체크리스트

- [ ] 서로 다른 폰 2대, **서로 다른 네트워크**(Wi-Fi / LTE)로 접속
- [ ] 플레이어 만들기 → 앱 새로고침 후 유지
- [ ] 랜덤 매칭 성사 시간, 초대 코드 참가
- [ ] 번갈아 투구가 상대 화면에 바로 반영되는지 (지연 체감)
- [ ] 한쪽 폰을 30초 이상 방치 → 시간 초과 처리, 3턴 연속이면 기권패
- [ ] 경기 중 앱을 백그라운드로 보냈다가 복귀 → 상태 복구
- [ ] 두 폰의 타이머 표시 차이 (폰 시계 차이 확인)
- [ ] 싱글 플레이 기록 / 전적 화면 반영
- [ ] 다크 모드, 작은 화면(360px) 레이아웃

## 알아둘 점

- **무료 플랜 일시 정지**: 스테이징 프로젝트를 7일간 사용하지 않으면 일시 정지됨 → 대시보드에서 Restore.
- **익명 가입 속도 제한**: 기본 IP 당 시간당 30회. 같은 Wi-Fi 에서 여러 명이 처음 접속하면 걸릴 수 있음 → Authentication → Rate Limits 에서 조정.
- **공개 키**: Publishable key 는 앱 코드에 포함되어 누구나 볼 수 있는 값이며, 데이터 보호는 RLS·RPC 권한이 담당합니다. Secret key / DB 비밀번호 / 액세스 토큰은 절대 앱이나 Git 에 넣지 않습니다.
- 레포가 **공개(public)** 이므로 코드와 마이그레이션이 공개됩니다. 비밀값이 커밋되지 않도록 주의.
