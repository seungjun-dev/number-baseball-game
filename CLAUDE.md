# CLAUDE.md — 숫자야구 (number-baseball-game)

이 파일은 Claude가 이 프로젝트에서 작업할 때 따르는 개발 지침입니다.

## 프로젝트 개요
- 숫자야구 게임 웹앱. 추후 안드로이드 WebView 앱으로 배포 예정.
- 1단계: 게임 핵심 기능만 구현. 이후 기능을 하나씩 추가한다.

## 기술 스택
- React 19 + TypeScript
- Vite (빌드/개발 서버), `base: './'` — WebView 로컬 에셋 로딩을 위해 상대 경로 빌드 유지
- Vitest + React Testing Library + jsdom (테스트)
- oxlint (린트)
- Supabase (BaaS) — Postgres + RLS, Auth(익명 → 카카오/구글 연결), Realtime. 로컬은 Supabase CLI + Docker

## 명령어
| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입체크 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` | 테스트 1회 실행 |
| `npm run test:watch` | 테스트 watch 모드 |
| `npm run typecheck` | 타입체크만 실행 |
| `npm run lint` | 린트 |
| `npm run supabase:start` / `supabase:stop` / `supabase:status` | 로컬 백엔드 (Docker 필요) |
| `npm run db:migration <이름>` | 새 마이그레이션 생성 |
| `npm run db:reset` | 로컬 DB 초기화 + 마이그레이션 재적용 |
| `npm run db:types` | DB 타입 생성 → `src/lib/supabase/database.types.ts` |

## 디렉토리 구조 (모듈화 원칙)
```
src/
  features/<기능명>/     # 기능 단위 모듈 (예: features/game)
    logic/              #   순수 로직 (React 의존 X) — 단위 테스트 필수
    components/         #   해당 기능 전용 UI 컴포넌트
    hooks/              #   해당 기능 전용 훅
    index.ts            #   기능의 공개 API (외부는 여기서만 import)
  components/           # 여러 기능에서 공유하는 UI 컴포넌트
  hooks/                # 공용 훅
  utils/                # 공용 유틸 (순수 함수)
  types/                # 공용 타입
  test/                 # 테스트 셋업
  lib/supabase/         # Supabase 클라이언트·설정·생성 타입
supabase/
  config.toml           # 로컬 백엔드 설정
  migrations/           # 스키마·RLS·RPC (SQL, 커밋 대상)
  tests/                # pgTAP DB 테스트
docs/                   # 설계 문서 (ONLINE_MATCH_DESIGN.md, LOCAL_BACKEND_SETUP.md)
```

## 개발 규칙
1. **모듈화**: 게임 규칙/판정 등 비즈니스 로직은 React와 분리된 순수 함수로 작성하고, UI는 이를 호출만 한다. 기능은 `features/` 아래 독립 모듈로 추가한다.
2. **테스트**: 기능 개발이 끝날 때마다 테스트를 작성·실행한다.
   - 순수 로직: `*.test.ts` 단위 테스트
   - 컴포넌트: `*.test.tsx` (Testing Library, 사용자 관점 쿼리 사용)
   - 테스트 파일은 대상 파일 옆에 둔다.
   - 타이머가 있는 컴포넌트를 user-event로 테스트할 때는 `vi.useFakeTimers({ shouldAdvanceTime: true })` + `userEvent.setup({ delay: null })` 조합을 쓴다 (그냥 fake timer를 쓰면 RTL 비동기 래퍼가 멈춤).
   - 커밋 전 `npm test`, `npm run build`, `npm run lint` 가 모두 통과해야 한다.
3. **랜덤 등 비결정성**은 주입 가능하게 설계해 테스트에서 고정할 수 있게 한다.
4. **모바일 우선**: WebView 대상이므로 터치 친화적 UI, 작은 화면(360px~) 기준으로 레이아웃한다. 브라우저 전용 API 사용 시 WebView 호환성을 고려한다.
5. TypeScript `any` 사용 지양, 공개 함수에는 명시적 타입을 단다.
6. UI 문구는 한국어. (단, 시안의 영문 중계 콜/라벨 — "OUT!", "SCOREBOARD" 등 — 은 시안을 따른다)
7. 스타일은 시안의 `src/index.css` 클래스를 그대로 사용한다. 시안에 없는 보완 스타일은 파일 하단 `App additions` 블록에 추가한다.

## 백엔드 (Supabase) 규칙
- 설계는 `docs/ONLINE_MATCH_DESIGN.md`, 로컬 환경은 `docs/LOCAL_BACKEND_SETUP.md` 를 따른다.
- 화면 코드는 Supabase를 직접 호출하지 않는다. `features/<기능>/` 의 service/repository가 `getSupabase()` 를 사용한다.
- 비밀 숫자·판정·매칭·승패는 **서버(Postgres RPC)에서만** 처리한다. 클라이언트 값을 신뢰하지 않는다.
- 모든 테이블에 RLS를 켠다. 쓰기는 원칙적으로 RPC(`security definer`)로만 허용한다.
- DB 변경은 반드시 마이그레이션 파일로 한다 (Studio에서 직접 수정 금지). 변경 후 `db:reset` → `db:types` → 테스트.
- 판정 로직을 SQL로 옮길 때는 TS 테스트와 같은 케이스(정답 3647 예시)를 pgTAP 테스트로 검증한다.
- 키: 앱에는 Publishable key만 (`.env.local`). Secret/service_role key와 OAuth 시크릿은 `supabase/.env` 등 Git 밖에 둔다.
- `.env.local` 이 없으면 온라인 기능만 비활성화되고 싱글 플레이는 동작해야 한다.

## 변경 로그
- 모든 기능 추가/수정/설정 변경은 `DEVLOG.md` 최상단에 날짜와 함께 기록한다.
- 형식: `## YYYY-MM-DD — 제목` 아래에 변경 내용, 테스트 결과를 적는다.

## Git
- 기본 브랜치: `main`
- 기능 단위로 커밋하며, 커밋 메시지는 `feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:` 접두사를 사용한다.
