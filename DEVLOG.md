# 개발 로그 (DEVLOG)

최신 항목이 위에 오도록 기록합니다.

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
