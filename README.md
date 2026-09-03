# VibePatchNote

Turborepo 기반 모노레포. 프론트엔드는 **FSD(Feature-Sliced Design)**, 백엔드는 **도메인 패키지 구조**를 따릅니다.

---

## 📁 프로젝트 구조

```text
VibePatchNote/
├── apps/
│   ├── web/                      # @vibe/web — React 19 + Vite + Tailwind v4 + React Flow + Tiptap
│   │   └── src/
│   │       ├── app/              # 진입점, 전역 Provider, 라우팅, 글로벌 스타일
│   │       ├── pages/            # 라우트 단위 페이지 (조합만 담당)
│   │       ├── widgets/          # 독립적인 거시 UI 블록
│   │       ├── features/         # 사용자 상호작용 단위 비즈니스 로직
│   │       ├── entities/         # 핵심 도메인 객체 + 기본 뷰
│   │       └── shared/           # api / config / lib / model / ui (도메인 무관)
│   └── api/                      # @vibe/api — FastAPI + Native Workflow Engine
│       └── app/
│           ├── core/             # config, workflow engine, antigravity (도메인 무관)
│           ├── documents/        # router.py / schemas.py / service.py
│           ├── rag/
│           ├── templates/
│           └── workspaces/
└── packages/
    ├── document-viewer/          # @vibe/document-viewer — 호스트 비의존 문서 뷰어 엔진
    └── config/                   # @vibe/config — 공통 TypeScript 설정
```

레이어 규칙 상세는 [.agents/rules/50-develop/convention](.agents/rules/50-develop/convention) 참조.

---

## 🚀 실행

```bash
pnpm install
```

```bash
pnpm dev
```

`pnpm dev` 는 turbo 가 웹(5173)과 API(8000)를 동시에 띄웁니다. 개별 실행:

```bash
pnpm --filter @vibe/web dev
```

```bash
pnpm --filter @vibe/api dev
```

- 프론트엔드: `http://localhost:5173`
- API 서버: `http://localhost:8000`
- Swagger 문서: `http://localhost:8000/docs`
- 헬스체크: `http://localhost:8000/health`

> 백엔드는 Python 의존성이 별도로 필요합니다: `pip install -r apps/api/requirements.txt`

---

## ✅ 검증

```bash
pnpm typecheck
```

```bash
pnpm lint
```

`pnpm lint` 는 FSD 레이어 위반(상위 레이어 참조, 동일 레이어 cross-import, 슬라이스 내부 경로 직접 참조, 순환 참조)을 **에러로 차단**합니다.

---

## ⚙️ 환경 변수

| 위치 | 변수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `apps/web` | `VITE_API_BASE_URL` | `http://localhost:8000` | 백엔드 오리진 |
| `apps/api` | `VIBE_PUBLIC_BASE_URL` | `http://localhost:8000` | 업로드 파일 URL 조립용 외부 오리진 |
| `apps/api` | `VIBE_CORS_ORIGINS` | `localhost:5173,127.0.0.1:5173,...` | 쉼표 구분 CORS 허용 오리진 |
| `apps/api` | `VIBE_UPLOAD_DIR` | `apps/api/uploads` | 업로드 저장 경로 |
| `apps/api` | `VIBE_DB_FILE` | `apps/api/workspaces_db.json` | 세션 저장 파일 |

`apps/web/.env.example` 참고.

---

## 🎨 ShadCN UI 컴포넌트 추가

```bash
pnpm --filter @vibe/web exec shadcn@latest add dialog
```

`components.json` alias 가 `@/shared/ui` 로 고정돼 있어 FSD 위치에 바로 생성됩니다.
