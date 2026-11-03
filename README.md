# ⚾ 숫자야구 (Number Baseball Game) — NUMBER LEAGUE

서로 다른 숫자 4개를 맞히는 숫자야구 게임입니다. 혼자 하는 **싱글 플레이**와 다른 사람과 실시간으로 겨루는 **온라인 1:1 대전**을 지원합니다.
React 웹앱으로 개발했고, 추후 안드로이드 WebView 앱으로 배포할 예정입니다.

- 스테이징: https://number-baseball-game-eight.vercel.app
- 저장소: https://github.com/seungjun-dev/number-baseball-game

---

## 목차
1. [주요 기능](#1-주요-기능)
2. [게임 규칙](#2-게임-규칙)
3. [기술 스택](#3-기술-스택)
4. [아키텍처](#4-아키텍처)
5. [디렉토리 구조](#5-디렉토리-구조)
6. [시작하기](#6-시작하기)
7. [명령어](#7-명령어)
8. [개발 가이드](#8-개발-가이드)
9. [테스트 전략](#9-테스트-전략)
10. [배포](#10-배포)
11. [개발 히스토리](#11-개발-히스토리)
12. [알려진 제약 · 다음 단계](#12-알려진-제약--다음-단계)
13. [관련 문서](#13-관련-문서)

---

## 1. 주요 기능

| 기능 | 내용 |
| --- | --- |
| 싱글 플레이 | 9번 안에 4자리 숫자 맞히기, 투구 연출(스윙 → 헛스윙 → 판정 콜), 점수판, 결과 화면 |
| 플레이어 만들기 | 첫 실행 시 익명 로그인 → 닉네임(2~12자)·아바타 선택, 프로필 수정 |
| 온라인 1:1 대전 | 랜덤 매칭 / 초대 코드(6자리), 비밀 숫자 설정, 실시간 턴 진행, 30초 턴 타이머, 기권, 이어하기 |
| 전적 확인 | 대전 승·패·무·승률, 싱글 판수·승률·최고 기록, 최근 대전 10경기 |
| 테마 | 라이트(미니멀 에디토리얼) / 다크(라이브 중계) |
| 오프라인 동작 | 서버 설정이 없으면 싱글 플레이만으로 동작 |

## 2. 게임 규칙

**공통**
- 0~9 중 서로 다른 숫자 4개 (중복 X)
- 숫자와 위치가 모두 맞으면 **스트라이크**, 숫자만 맞으면 **볼**, 둘 다 없으면 **아웃**
- 예) 정답 `3647` → `1234` 2볼 · `5678` 1스트라이크 1볼 · `1290` 아웃 · `4637` 2스트라이크 2볼 · `3647` 승리

**싱글 플레이**: 최대 9회, 4스트라이크면 승리

**온라인 1:1 대전**
- 각자 비밀 숫자를 정하고(60초 이내) 번갈아 상대 숫자를 맞힘, 선공은 무작위
- 각자 최대 9회, 둘 다 못 맞히면 무승부
- **공정성 규칙**: 선공이 먼저 맞히면 후공에게 같은 횟수의 마지막 기회 → 후공도 맞히면 무승부
- 턴당 30초(+네트워크 여유 2초), 초과 시 그 턴은 아웃 · 같은 사람이 3턴 연속 시간 초과면 기권패
- 경기 중 나가기 = 기권패

## 3. 기술 스택

### 프론트엔드
| 기술 | 버전 | 역할 · 선택 이유 |
| --- | --- | --- |
| **React** | 19.3 | UI. 함수형 컴포넌트 + 훅 |
| **TypeScript** | 7.0 | 정적 타입. DB 스키마에서 생성한 타입으로 서버 응답까지 타입 체크 |
| **Vite** | 8.3 | 개발 서버·빌드. `base: './'`(상대 경로)로 빌드해 WebView 로컬 파일 로딩 대비 |
| CSS | — | 디자인 시안(`src/index.css`)의 클래스를 그대로 사용, 보완 스타일만 하단에 추가 |

### 백엔드 (BaaS)
| 기술 | 역할 · 선택 이유 |
| --- | --- |
| **Supabase** (`@supabase/supabase-js` 2.118) | Postgres + 인증 + 실시간을 한 번에 제공. 무료 플랜에서도 서버 로직 가능, 카카오/구글 로그인 기본 지원 |
| PostgreSQL + **RLS** | 전적 통계에 유리한 관계형 DB. 행 단위 보안으로 테이블 접근 제어 |
| **Postgres 함수 (RPC)** | 매칭·판정·승패를 서버에서 한 트랜잭션으로 처리 (부정행위 방지) |
| **Auth (익명 로그인)** | 로그인 화면 없이 바로 시작, 추후 카카오/구글 계정 연결 |
| **Realtime** | 상대 투구·경기 상태를 즉시 반영 |
| **pg_cron** | 10초 주기 정리 작업 (만료된 방, 끊긴 대기열, 턴 시간 초과) |
| Supabase CLI 2.122 + **Docker** | 로컬에서 전체 백엔드 실행, 마이그레이션 관리 |

> Firebase 대신 Supabase 를 고른 이유: 서버 판정 함수를 무료로 쓸 수 있고(Firebase 는 유료 플랜 필요), 전적 집계를 SQL 로 처리할 수 있으며, 카카오 로그인을 기본 지원합니다. 비교 내용은 [docs/ONLINE_MATCH_DESIGN.md](docs/ONLINE_MATCH_DESIGN.md) 참고.

### 테스트 · 품질
| 기술 | 역할 |
| --- | --- |
| **Vitest** 5 + jsdom | 단위·컴포넌트 테스트 |
| **React Testing Library** + user-event | 사용자 관점(라벨·역할) 컴포넌트 테스트 |
| **pgTAP** (`supabase test db`) | DB 규칙·보안·경기 흐름 테스트 |
| **oxlint** | 린트 (React 훅 규칙 포함) |

### 인프라 · 배포
| 기술 | 역할 |
| --- | --- |
| **GitHub Actions** | push/PR 마다 lint·test·build·DB 테스트, `main` 통과 시 스테이징 DB 마이그레이션 반영 |
| **Vercel** | 웹 자동 배포 (`main` → 배포, PR → 미리보기 주소) |
| **Supabase Cloud** | 스테이징 백엔드 (서울 리전) |
| Capacitor (예정) | 웹앱을 안드로이드 앱으로 패키징 |

## 4. 아키텍처

```
┌──────────────────────── 앱 (React, 브라우저 / WebView) ─────────────────────────┐
│  App.tsx ── 화면 전환 (home · single · stats · versus)                          │
│     │                                                                            │
│  features/                                                                       │
│   ├ game    싱글 플레이   logic(판정·검증) ─ hooks(연출 타이머) ─ components      │
│   ├ home    모드 선택                                                            │
│   ├ player  플레이어      api(PlayerRepository) ─ hooks(usePlayer) ─ components  │
│   ├ stats   전적          api(StatsRepository)  ─ hooks(useStats)  ─ components  │
│   └ match   1:1 대전      api(MatchService)     ─ hooks(useMatch, useMatchmaking)│
│                           logic(matchView: 차례·타이머·결과 계산) ─ components   │
│     │                                                                            │
│  app/services.ts ── 서버 연동 모듈 주입 (서버 미설정 → null → 오프라인)          │
│  lib/supabase   ── 클라이언트, 환경변수, 에러 → 한국어 문구, DB 생성 타입        │
└─────────┬────────────────────────────────────────────────────────────────────────┘
          │ supabase-js (REST · RPC · Realtime WebSocket)
┌─────────▼──────────────────────── Supabase ──────────────────────────────────────┐
│  Auth (익명)   Realtime (matches · match_players · guesses 변경 구독)            │
│  Postgres                                                                        │
│   ├ 테이블: profiles · matches · match_players · match_secrets(앱 접근 불가)      │
│   │         guesses · matchmaking_queue · solo_games      — 전부 RLS             │
│   ├ RPC (security definer): 매칭 · 비밀 숫자 · 투구 판정 · 시간 초과 · 전적       │
│   └ pg_cron: private.sweep() 10초 주기                                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 핵심 설계 원칙

1. **서버 권위(server-authoritative)** — 비밀 숫자는 앱이 읽을 수 없는 테이블에 저장하고, 판정·차례·승패는 모두 Postgres 함수에서 처리합니다. 앱이 보낸 결과는 믿지 않습니다.
2. **쓰기는 RPC 로만** — 모든 테이블에 RLS 를 켜고 앱의 insert/update 권한을 회수했습니다. (예외: 본인 프로필의 닉네임·아바타)
3. **기능 단위 모듈화** — 기능마다 `api / logic / hooks / components` 로 나누고, 외부에서는 `index.ts` 로만 가져옵니다.
4. **순수 로직 분리** — 게임 규칙·전적 계산·대전 화면 상태 계산은 React 와 무관한 순수 함수라 단위 테스트가 쉽습니다.
5. **인터페이스 + 주입** — 서버 연동은 `PlayerRepository` · `StatsRepository` · `MatchService` 인터페이스로 정의하고 `app/services.ts` 에서 주입합니다. 테스트는 메모리 구현(`src/test/fakes`)을 넣습니다.
6. **실시간은 "알림 → 다시 조회"** — Realtime 알림을 받으면 경기 스냅샷을 다시 조회합니다. 알림을 놓쳐도 다음 조회·heartbeat 로 상태가 맞춰집니다.
7. **오프라인 우선** — `.env.local` 이 없으면 서버 기능만 꺼지고 싱글 플레이는 그대로 동작합니다.

### 랜덤 매칭 흐름
```
앱: Realtime 구독 → "Subscribed to PostgreSQL" 확인 → enqueue_random_match() (5초마다 heartbeat)
서버: advisory lock 으로 매칭 직렬화 → 20초 안에 응답한 대기자와 짝 → 경기 생성
앱: Realtime 알림 또는 heartbeat 응답으로 매칭 감지 → 비밀 숫자 설정 화면
pg_cron: 응답 없는 대기자 정리
```

## 5. 디렉토리 구조

```
number-baseball-game/
├── src/
│   ├── App.tsx                 # 화면 전환, 테마, 플레이어 상태
│   ├── app/services.ts         # 서버 연동 모듈 주입
│   ├── components/             # 공용 UI: AppHeader, AppFooter, ThemeToggle, DigitInputGroup,
│   │                           #          PrimaryButton, TextButton, TextField, Eyebrow
│   ├── features/
│   │   ├── game/               # 싱글 플레이 (logic: answer·judge·validate·format·game)
│   │   ├── home/               # 홈 (ModeCard 재사용)
│   │   ├── player/             # 플레이어 만들기·수정
│   │   ├── stats/              # 전적
│   │   └── match/              # 온라인 1:1 대전
│   ├── hooks/useNow.ts         # 공용 훅
│   ├── lib/supabase/           # 클라이언트·설정·에러 문구·DB 생성 타입
│   ├── test/                   # 테스트 셋업, fakes/(메모리 repository·service)
│   ├── types/                  # 공용 타입 (테마)
│   └── index.css               # 디자인 시안 스타일 + 하단 App additions
├── supabase/
│   ├── config.toml             # 로컬 백엔드 설정 (익명 로그인 등)
│   ├── migrations/             # 스키마·RLS·RPC SQL
│   └── tests/                  # pgTAP 테스트 (01_rules · 02_security · 03_match_flow)
├── docs/                       # 설계·환경·배포 문서
├── .github/workflows/ci.yml    # CI
├── vercel.json                 # 웹 배포 설정
├── CLAUDE.md                   # 개발 지침 (코드 규칙의 기준 문서)
└── DEVLOG.md                   # 변경 로그
```

각 기능 폴더 구성:
```
features/<기능>/
├── api/          서버 연동 — 인터페이스 + Supabase 구현
├── logic/        순수 함수 — 단위 테스트 필수
├── hooks/        상태·부수효과 (React 훅)
├── components/   화면 (logic/hooks 를 호출만)
└── index.ts      공개 API
```

## 6. 시작하기

### 준비물
- Node.js 22 이상
- (온라인 기능을 쓸 때) Docker Desktop 또는 OrbStack — 설치·설정: [docs/LOCAL_BACKEND_SETUP.md](docs/LOCAL_BACKEND_SETUP.md)

### 싱글 플레이만 (서버 없이)
```bash
npm install
```
```bash
npm run dev
```
http://localhost:5173 접속

### 온라인 기능까지 (로컬 Supabase)
```bash
npm run supabase:start
```
출력된 API URL / Publishable key 를 `.env.local` 에 넣습니다.
```bash
cp .env.example .env.local
```
```bash
npm run dev
```

> 같은 브라우저 탭 두 개는 로그인을 공유합니다. 혼자 대전을 테스트하려면 `http://localhost:5173` 과 `http://[::1]:5173` 처럼 주소를 다르게 열거나, 일반 창 + 시크릿 창을 사용하세요.

## 7. 명령어

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입체크 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` / `npm run test:watch` | 앱 테스트 (1회 / watch) |
| `npm run typecheck` | 타입체크 |
| `npm run lint` | 린트 |
| `npm run supabase:start` / `stop` / `status` | 로컬 백엔드 시작·중지·상태 (Docker 필요) |
| `npm run db:migration <이름>` | 새 마이그레이션 파일 생성 |
| `npm run db:reset` | 로컬 DB 초기화 + 마이그레이션 재적용 |
| `npm run db:types` | DB 스키마 → `src/lib/supabase/database.types.ts` |
| `npx supabase test db` | DB 테스트 (pgTAP) |
| `npm run db:link` / `db:push` | 원격(스테이징) 연결 / 마이그레이션 반영 ⚠️ 원격 DB 변경 |

> Supabase CLI 명령은 반드시 **이 폴더에서** 실행하세요. 상위 폴더에서 `npx supabase` 를 실행하면 다른 버전의 CLI 가 받아져 엉뚱한 대상에 실행됩니다.

## 8. 개발 가이드

상세 규칙의 기준 문서는 [CLAUDE.md](CLAUDE.md) 입니다. 이 프로젝트는 아래 흐름으로 개발했습니다.

### 기능 개발 흐름
```
1. 설계        규칙·데이터·API 를 문서로 먼저 정리 (예: docs/ONLINE_MATCH_DESIGN.md), 결정 필요 항목 확정
2. 순수 로직   logic/ 에 React 없는 함수 작성 + 단위 테스트
3. 서버        (필요 시) 마이그레이션 → db:reset → pgTAP 테스트 → db:types
4. 연동 계층   api/ 에 인터페이스 + Supabase 구현, test/fakes/ 에 메모리 구현
5. 훅·화면     hooks/ → components/ (시안 클래스 재사용), fake 주입 컴포넌트 테스트
6. 실제 확인   브라우저(모바일 375px)에서 직접 플레이, 대전은 봇 상대 스크립트로 검증
7. 마무리      npm test · build · lint (+ supabase test db) 통과 → DEVLOG 기록 → 기능 단위 커밋
```

### 코드 규칙 요약
- **모듈화**: 비즈니스 로직은 순수 함수, UI 는 호출만. 기능 간에는 `index.ts` 로만 의존.
- **재사용**: 공용 UI 는 `src/components`, 기능 간 공유가 필요한 컴포넌트(예: `ModeCard`, `ScoreList`, `GuessInput`)는 해당 기능의 공개 API 로 노출.
- **비결정성 주입**: 난수(`generateAnswer(random)`), 타이밍(`PitchTiming`), 서버(`services`)를 주입 가능하게 만들어 테스트에서 고정.
- **서버 접근**: 화면 코드는 Supabase 를 직접 부르지 않고 repository/service 를 통해서만.
- **DB 변경**: 반드시 새 마이그레이션 파일로. 이미 원격에 반영된 파일은 수정 금지.
- **에러 문구**: 서버 에러 코드(`not_your_turn` 등)는 `toUserMessage()` 로 한국어 안내 문구로 변환.
- **UI**: 모바일 우선(360px~), 한국어 문구(시안의 영문 중계 콜은 유지), 시안 클래스 재사용.
- **타입**: `any` 지양, 공개 함수에 명시적 타입. 서버 응답은 생성 타입(`Database`) 사용.

### 키 · 비밀값
| 값 | 위치 | Git |
| --- | --- | --- |
| Supabase URL, **Publishable key** | `.env.local` (로컬), Vercel 환경변수 (배포) | ❌ (`.env.example` 만 커밋) |
| Secret key, DB 비밀번호, 액세스 토큰 | GitHub Secrets, 비밀번호 관리자 | ❌ 절대 커밋·앱 포함 금지 |
| OAuth 시크릿 (추후) | `supabase/.env` | ❌ |

### 커밋 · 기록
- 커밋 접두사: `feat:` `fix:` `test:` `chore:` `docs:` `refactor:` `design:`
- 모든 변경은 [DEVLOG.md](DEVLOG.md) 최상단에 날짜·변경 내용·테스트 결과를 기록

## 9. 테스트 전략

| 층 | 도구 | 대상 | 규모 |
| --- | --- | --- | --- |
| 순수 로직 | Vitest | 판정·검증·경기 상태 전이·전적 계산·대전 화면 계산 | |
| 훅 | Vitest + `renderHook` + fake timer | 투구 연출, 플레이어 상태, 매칭 heartbeat | **앱 24개 파일 / 100개** |
| 컴포넌트 | React Testing Library | 입력·화면 흐름 (fake repository/service 주입) | |
| DB | pgTAP | 판정 규칙, RLS·권한, 경기·매칭·시간 초과·전적 | **3개 파일 / 67개** |
| 실제 API | supabase-js 스크립트 | 익명 로그인 → 매칭 → Realtime → 투구 | 수동 실행 |
| 브라우저 | 직접 플레이 + 봇 상대 | 싱글·랜덤 매칭·초대 코드·기권·전적 반영 | 수동 |

- 규칙의 연습 예시(정답 3647)는 **TS 테스트와 pgTAP 테스트에 같은 케이스**로 들어 있어 앱·서버 판정이 어긋나지 않게 합니다.
- 앱 테스트는 `.env.local` 을 무시하고 항상 오프라인으로 실행됩니다 (`vite.config.ts` 의 `test.env`).
- 타이머가 있는 컴포넌트 테스트는 `vi.useFakeTimers({ shouldAdvanceTime: true })` + `userEvent.setup({ delay: null })` 조합을 씁니다.

## 10. 배포

| 대상 | 방식 | 상태 |
| --- | --- | --- |
| 백엔드 | Supabase Cloud 스테이징 (서울), `npm run db:push` 또는 CI 자동 반영 | ✅ 마이그레이션 반영 완료 |
| 웹 | Vercel — `main` push 시 자동 배포 | ✅ https://number-baseball-game-eight.vercel.app |
| CI | GitHub Actions — 앱(lint·test·build), DB(pgTAP), 스테이징 DB 반영 | ✅ 첫 실행 통과 (DB 자동 반영은 Secrets 등록 후 동작) |
| 안드로이드 | Capacitor → Google Play | ⏳ 3단계 예정 |

배포 단계 계획: **1단계 스테이징**(완료) → **2단계 출시 준비**(계정 삭제, 개인정보처리방침, CAPTCHA, 폰트 내장, 코드 분할) → **3단계 운영 + 안드로이드**(운영 DB 분리, Play 비공개 테스트 14일).
절차는 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) 참고.

## 11. 개발 히스토리

| 날짜 | 작업 | 커밋 |
| --- | --- | --- |
| 10.28 | 개발 환경 세팅 (Vite + React + TS + Vitest), GitHub 연결 | `cf2d551` |
| 10.28 | 디자인 시안 보존 → 싱글 플레이 구현 (로직 모듈화, 투구 연출, 테마) | `8f9ea9b` `57db3a9` |
| 10.29 | 온라인 대전 방식 결정(Supabase), 로컬 백엔드 환경, 대전·랜덤 매칭 설계 | `367e8eb` |
| 10.31 | 백엔드: 스키마·RLS·매칭/경기 RPC·pg_cron, pgTAP 67개 | `83e78d2` |
| 10.31 | 화면: 플레이어 만들기 → 전적 → 온라인 1:1 대전, 봇 상대 실제 검증 | `b9f6132` `3d6220b` `7df0dce` |
| 10.31 | 중간 폭 레이아웃 수정 | `3e2aa26` |
| 11.03 | 배포 1단계: CI, Vercel, 스테이징 DB 반영 | `2293238` `5b748bf` |

개발 중 테스트·실제 검증으로 잡은 주요 버그 (상세: [DEVLOG.md](DEVLOG.md))
- 이미 채워진 칸에 같은 숫자 재입력 시 다음 칸으로 넘어가지 않음 / 빠른 연속 입력 시 숫자 유실
- 3턴 연속 시간 초과·기권 처리 시 SQL 함수 인자 타입 불일치로 실패
- Realtime 구독 직후 알림 누락 (→ "Subscribed to PostgreSQL" 이후 호출 + heartbeat 보완)
- 개발 모드 이중 실행으로 익명 계정이 2개 생성됨 (→ 진행 중 로그인 요청 공유)

## 12. 알려진 제약 · 다음 단계

- **싱글 기록은 클라이언트 보고값** — 서버가 검증할 수 없음 (온라인 전적은 서버 판정이라 신뢰 가능)
- **턴 타이머 표시는 기기 시계 기준** — 폰 시계 차이만큼 표시가 어긋날 수 있음 (판정은 서버 시각 기준)
- **상대 비밀 숫자 비공개** — 경기 후 공개하려면 서버 함수 추가 필요
- **번들 크기** 472KB (gzip 136KB) — 대전 화면 코드 분할 예정
- **Google Fonts 외부 로딩** — 앱 배포 전 폰트 내장 필요
- 다음: 출시 준비(계정 삭제·개인정보처리방침·CAPTCHA) → 카카오/구글 로그인 연결 → Capacitor 안드로이드 앱

## 13. 관련 문서

| 문서 | 내용 |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | 개발 지침 — 구조·코드·테스트·백엔드·배포 규칙 |
| [DEVLOG.md](DEVLOG.md) | 날짜별 변경 로그 (결정·변경·버그·테스트 결과) |
| [docs/ONLINE_MATCH_DESIGN.md](docs/ONLINE_MATCH_DESIGN.md) | 온라인 대전 설계 — 데이터 모델, 매칭, 규칙, RPC 목록, Realtime 주의사항 |
| [docs/LOCAL_BACKEND_SETUP.md](docs/LOCAL_BACKEND_SETUP.md) | Docker 설치·설정, 로컬 Supabase 실행 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 스테이징 배포 (Supabase Cloud · Vercel · GitHub Actions), 테스트 체크리스트 |
