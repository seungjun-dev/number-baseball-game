# 로컬 백엔드(Supabase + Docker) 환경 설정

Supabase CLI는 Postgres, Auth, Realtime, Studio 등을 **Docker 컨테이너**로 내 맥에서 띄웁니다.
그래서 Docker 하나만 설치하면 클라우드 프로젝트 없이도 온라인 기능을 개발·테스트할 수 있습니다.

## 1. Docker Desktop 설치 (macOS, Apple Silicon)

1. https://www.docker.com/products/docker-desktop/ → **Download for Mac – Apple Silicon**
2. `Docker.dmg` 실행 → Docker 아이콘을 Applications 로 드래그
3. Applications 에서 Docker 실행 → 약관 동의 → 계정 로그인은 **건너뛰어도 됨(Skip)**
4. 권한 요청(헬퍼 설치) 시 맥 비밀번호 입력
5. 메뉴 막대의 고래 아이콘이 **Docker Desktop is running** 이 될 때까지 대기

> 라이선스: 개인·교육·소규모 사업자(직원 250명 미만, 매출 1천만 달러 미만)는 무료입니다.
>
> 대안: 더 가벼운 **OrbStack**(https://orbstack.dev, 개인 무료)도 Docker 명령과 호환되어 Supabase CLI가 그대로 동작합니다. 맥 배터리·메모리가 아쉬우면 OrbStack을 추천합니다. 둘 중 하나만 설치하세요.

## 2. Docker Desktop 권장 설정

Docker Desktop → 우측 상단 ⚙️ **Settings**

| 메뉴 | 항목 | 권장값 | 이유 |
| --- | --- | --- | --- |
| General | Start Docker Desktop when you sign in | 취향 (끄면 개발할 때만 수동 실행) | 상시 메모리 사용 방지 |
| General | Use Virtualization framework | ✅ 켬 (기본값) | Apple Silicon 성능 |
| General | Choose file sharing implementation | **VirtioFS** (기본값) | Edge Function 핫 리로드 등 파일 공유 속도 |
| Resources → Advanced | CPU | 4 | Supabase 컨테이너 ~10개 |
| Resources → Advanced | Memory | **4 GB 이상** (여유 있으면 6 GB) | 부족하면 `supabase start` 중 컨테이너가 죽음 |
| Resources → Advanced | Swap | 1 GB | |
| Resources → Advanced | Virtual disk limit | 32 GB 이상 | 이미지 약 3~4 GB |
| Resources → File sharing | 공유 경로 | `/Users` 포함 (기본값) | 프로젝트 폴더 마운트 |

이 프로젝트의 `supabase/config.toml` 에서는 로컬 자원 절약을 위해 무거운 **로그 수집(analytics)**·**vector 버킷**을 꺼 두었습니다.

## 3. 설치 확인

```bash
docker version
docker run --rm hello-world
```
`Hello from Docker!` 가 보이면 성공입니다.

## 4. Supabase 로컬 실행

프로젝트 폴더(`number-baseball-game/`)에서:

```bash
npm run supabase:start     # 첫 실행은 이미지 다운로드로 몇 분 걸림
```

끝나면 아래와 비슷한 정보가 출력됩니다 (`npm run supabase:status` 로 다시 볼 수 있음).

| 항목 | 주소 | 용도 |
| --- | --- | --- |
| API URL | http://127.0.0.1:54321 | 앱이 접속하는 주소 |
| Studio | http://127.0.0.1:54323 | DB 테이블·데이터를 보는 관리 화면 |
| DB URL | postgresql://postgres:postgres@127.0.0.1:54322/postgres | DB 직접 접속 |
| Publishable key | `sb_publishable_…` | 앱에 넣는 공개 키 |
| Secret key | `sb_secret_…` | ⚠️ 서버 전용 — 앱/채팅/Git 에 넣지 않기 |

### 앱과 연결
```bash
cp .env.example .env.local
```
`.env.local` 의 `VITE_SUPABASE_PUBLISHABLE_KEY` 에 위 Publishable key 를 붙여넣고 `npm run dev` 를 다시 실행합니다.
(`.env.local` 이 없으면 온라인 기능만 꺼지고 싱글 플레이는 그대로 동작합니다.)

## 5. 자주 쓰는 명령

| 명령 | 설명 |
| --- | --- |
| `npm run supabase:start` / `supabase:stop` | 로컬 백엔드 시작 / 중지 (데이터 유지) |
| `npm run supabase:status` | 주소·키 확인 |
| `npm run db:migration <이름>` | 새 마이그레이션 SQL 파일 생성 (`supabase/migrations/`) |
| `npm run db:reset` | DB 초기화 후 모든 마이그레이션 + `seed.sql` 재적용 |
| `npm run db:types` | DB 스키마로 TS 타입 생성 → `src/lib/supabase/database.types.ts` |
| `npm run functions:serve` | Edge Function 로컬 실행 (도입 시) |

## 6. 문제 해결

- **`docker: command not found` / `Cannot connect to the Docker daemon`** → Docker Desktop 이 실행 중인지 확인
- **포트 충돌 (54321~54327)** → 다른 Supabase 프로젝트가 떠 있는지 `docker ps` 로 확인 후 그 프로젝트에서 `supabase stop`
- **컨테이너가 계속 재시작 / start 가 멈춤** → Docker 메모리를 6 GB 로 올리고 `npx supabase stop --no-backup` 후 다시 start (⚠️ `--no-backup` 은 로컬 DB 데이터 삭제)
- **디스크 부족** → Docker Desktop → Troubleshoot → Clean / Purge data, 또는 `docker system prune`

## 7. 원격(클라우드) 프로젝트 연결 — 배포 단계에서

1. supabase.com 에서 프로젝트 생성 (리전: Northeast Asia (Seoul))
2. `npx supabase login` → `npx supabase link --project-ref <프로젝트 ref>`
3. `npx supabase db push` 로 로컬 마이그레이션을 원격에 반영
4. 대시보드 Authentication 에서 Anonymous sign-ins 켜기 (로컬은 `config.toml` 로 이미 켜짐)
5. 배포용 환경변수에 원격 URL / Publishable key 설정
