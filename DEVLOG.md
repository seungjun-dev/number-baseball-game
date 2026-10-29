# 개발 로그 (DEVLOG)

최신 항목이 위에 오도록 기록합니다.

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
