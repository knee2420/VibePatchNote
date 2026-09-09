---
description: "[최우선] 모든 코드 변경에 적용하는 아키텍처 헌법"
priority: 0
applies_to: "모든 코드 변경 (apps/**, packages/**)"
---

# ⛔ 00-core — 아키텍처 헌법

> 코드를 쓰거나 고치기 전 이 문서를 읽는다. 하위 규칙과 충돌하면
> 이 문서가 우선한다. 예외는 §7 절차로만 허용한다.

## 0. 사용할 때

| 상황 | 확인할 절 |
| --- | --- |
| 코드 위치를 정할 때 | §3 |
| 구현 중 경계가 막힐 때 | §4, §7 |
| 작업을 끝낼 때 | §6 |
| 상세 사례가 필요할 때 | §10 |

## 1. 구조 한눈에 보기

```text
VibePatchNote/
├── apps/
│   ├── web/  React · Vite · Tailwind · FSD
│   └── api/  FastAPI · 도메인 패키지
└── packages/
    ├── scaffold-engine       Python 문서 분석 엔진
    ├── document-viewer       문서 뷰어
    ├── tiptap-scaffold       스캐폴드 편집기
    └── config                TypeScript 설정
```

- 앱은 수직 계층(HTTP → 유스케이스 → 인프라)으로 나눈다.
- 패키지는 수평 파이프라인(측정 → 판정 → 조립 → 채점)으로 나눈다.
- 따라서 앱의 레이어 규칙을 패키지에 그대로 적용하지 않는다.
- 프론트 경계는 린터가 강제한다. 백엔드 경계는 현재 리뷰로 확인하며,
  `ruff`와 `import-linter` 도입 후 자동화한다.

## 2. 불변 원칙

| # | 원칙 | 뜻 |
| --- | --- | --- |
| P1 | 단방향 의존 | 하위 계층은 상위 계층을 참조하지 않는다. |
| P2 | 슬라이스 격리 | 같은 계층의 다른 슬라이스·도메인을 직접 참조하지 않는다. |
| P3 | Public API | 외부 접근은 `index.ts` 또는 `__init__.py`만 경유한다. |
| P4 | 로직·뷰 분리 | 통신·상태·검증은 훅 또는 서비스에 둔다. |
| P5 | SSOT | 함께 바뀌어야 하는 지식은 한 곳에만 둔다. |
| P6 | AHA | 우연히 비슷한 코드는 요구가 굳을 때까지 복제한다. |
| P7 | 자동 검증 | 완료 전 정해진 검증 게이트를 실행한다. |

P5와 P6의 판단법: 한쪽 변경이 다른 쪽 변경을 반드시 요구하면 SSOT,
그렇지 않으면 AHA를 적용한다.

## 3. 코드 배치

### 3.1 프론트엔드: `apps/web/src`

```text
app → pages → widgets → features → entities → shared
```

화살표 오른쪽으로만 import한다.

| 코드의 성격 | 위치 |
| --- | --- |
| 여러 호스트에서 재사용할 엔진 | `packages/<name>` |
| 범용 UI·lib·HTTP·환경 설정 | `shared/` |
| 핵심 도메인과 기본 표현 | `entities/<domain>` |
| 사용자의 단일 동작 | `features/<action>` |
| 여러 요소를 묶은 화면 블록 | `widgets/<block>` |
| 라우트 화면 조합 | `pages/<route>` |
| 전역 Provider·라우팅·CSS | `app/` |

슬라이스 최상위 세그먼트는 `ui/`, `model/`, `api/`, `lib/`,
`config/`, `index.ts`로 제한한다. 하위 분류는 세그먼트 안에 둔다.
`handlers/`, `utils/`, `helpers/`를 최상위에 새로 만들지 않는다.

현재 슬라이스를 먼저 확인한다.

```text
app/       providers, routes, styles
pages/     dashboard, editor
widgets/   hybrid-editor-board, project-dashboard
features/  api-health, canvas-file-drop, canvas-node-actions,
           canvas-settings, canvas-toolbar, workspace
entities/  canvas-board, reference-document, resource-card,
           segment, workspace-session
shared/    api, config, lib, model, ui
```

### 3.2 백엔드: `apps/api/app`

```text
bootstrap → <domain> → core → packages/scaffold-engine
```

화살표 오른쪽으로만 import한다.

- `bootstrap/`: 객체 그래프 조립. 실제 구현체 선택은 여기서만 한다.
- `<domain>/`: HTTP, 유스케이스, 계약, 구현을 함께 둔다.
- `core/`: 설정, 로깅, LLM 실행·관측, 저장 경로 같은 도메인 무관 인프라.
- `models.py`: 여러 도메인이 공유하는 Pydantic 모델.
- `core/`가 도메인 import, 도메인 고유 명사, 프롬프트 문자열을 가지면
  위반이다.
- `documents → scaffolds`만 단방향 참조를 허용한다. 다른 도메인 간
  참조는 금지한다.
- `workspaces`는 본문을 소유하지 않고 `documentId`, `scaffoldId`
  포인터만 보관한다.

도메인은 아래 구조를 따른다.

```text
app/<domain>/
├── __init__.py   # 외부 공개 API
├── router.py     # HTTP 입출력과 서비스 호출
├── schemas.py    # 요청·응답 Pydantic 모델
├── service.py    # 유스케이스 조율
├── ports.py      # 외부 의존 계약(Protocol)
└── adapters/     # 파일·DB·외부 API 구현
```

- 라우터에는 비즈니스 로직, DB·파일 접근, 함수 내부 import를 두지 않는다.
- 서비스는 구체 클래스가 아닌 `ports.py`의 `Protocol`에 의존한다.
- 어댑터 선택과 서비스 생성은 `bootstrap/container.py`에서만 한다.
- 모듈 전역 싱글턴은 만들지 않는다.
- 프롬프트는 실행하는 도메인의 `prompts.py` 또는 엔진이 소유한다.
- `storage.py`, `manager.py`, `utils.py` 같은 모호한 최상위 파일은
  만들지 않는다.

#### DI·포트·HTTP 경계의 기준

- 이 저장소의 DI 컨테이너 표준은 `dependency-injector`다. 새 서비스와
  어댑터는 컨테이너의 provider로 조립하고, 라우터는 주입받은 서비스만 쓴다.
- 파일·DB·LLM·외부 API·다른 도메인처럼 교체 가능하거나 외부 I/O를 하는
  의존성은 반드시 포트(`Protocol`)로 표현한다.
- `documents → scaffolds` 참조는 허용하되, 구현 서비스나 저장소를 직접
  가져오지 않는다. 필요한 동작을 포트로 정의해 컨테이너에서 주입한다.
- `router.py`만 FastAPI의 `UploadFile`, `Request`, `HTTPException`을 안다.
  서비스는 프레임워크 타입 대신 명시적 입력값과 도메인 오류를 사용한다.
- 서비스는 저장 형식과 파일 경로를 직접 다루지 않는다. 형식·경로·I/O는
  도메인 어댑터와 `core/storage`의 책임으로 나눈다.

### 3.3 공용 패키지: `packages/*`

- `packages/*`는 `apps/*`를 import하지 않는다.
- 앱과 패키지가 공유하는 계약의 정본은 패키지다.
- 앱에서는 패키지의 Public API만 import한다.
- 파이프라인 불변식은 패키지 `README.md` 또는 진입 모듈 docstring에
  기록한다.
- 호스트에 독립적이고, 재사용 가능하며, 라이브러리 API 또는 CLI 진입점이
  있을 때만 패키지로 승격한다.

외부 Dify 클라이언트에 의존하지 않는다. 현재 분석 파이프라인의 정본은
`scaffold-engine`이다. 존치 여부가 결정되기 전까지 새 기능에서
`app/core/workflow/`를 사용하지 않는다. 기존 workflow 의존 기능은
`scaffold-engine` 파이프라인과 그 공개 계약으로 순차 이관하고, 이관 뒤
`app/core/workflow/`를 제거한다.

## 4. 금지와 대안

### 프론트엔드

- 상위 계층·같은 계층·슬라이스 내부를 직접 import하지 않는다.
  Public API를 경유하거나, 공통분모를 하위 계층으로 옮기거나,
  상위 위젯에서 조합한다.
- `fetch()` 직접 호출과 API URL 하드코딩을 금지한다.
  `shared/api`의 `httpClient`, `shared/config`의 `env.apiBaseUrl`을 쓴다.
- 컴포넌트·라우터의 `useEffect` 통신은 헤드리스 훅으로 분리한다.
- 훅에서 `alert`, `confirm`, `prompt`를 호출하지 않는다.
  UI 콜백으로 위임한다.
- 영속 노드 타입은 문자열 리터럴이 아닌 상수로 관리한다.
- 경계 린트 규칙을 `oxlint-disable` 또는 `eslint-disable`로 끄지 않는다.

### 백엔드

- `core/`에서 도메인을 import하거나 도메인 세부를 저장하지 않는다.
  필요한 값은 인자로 주입하고, 도메인 세부는 `adapters/`에 둔다.
- 도메인·패키지 내부 모듈을 직접 import하지 않는다. Public API를 쓴다.
- 경로, 모델명, 타임아웃은 `core/config.py`의 `settings`로 관리한다.
- 산출물 존재는 파일 유무가 아니라 `manifest.json`의 상태 필드로 판단한다.
- 외부 CLI·API 실패를 성공으로 위장하지 않는다. 실패 상태를 응답에 드러낸다.
- FastAPI 응답 변환은 라우터에서 한다. 서비스는 HTTP 상태 코드가 아닌
  도메인 오류를 반환하거나 발생시킨다.

## 5. 정본 구현

새 코드는 먼저 아래 구현의 구조를 읽고 따른다.

| 작업 | 정본 |
| --- | --- |
| 웹 API 통신 | `features/workspace/api/workspaceApi.ts` |
| 헤드리스 훅 | `features/workspace/model/useSessionSync.ts` |
| 엔티티 액션 | `features/workspace/model/useSessionActions.ts` |
| 위젯 조합 | `widgets/hybrid-editor-board/ui/HybridEditorBoard.tsx` |
| 페이지 조합 | `pages/editor/ui/EditorPage.tsx` |
| API 라우터 | `apps/api/app/documents/router.py` |
| 포트·어댑터 | `documents/ports.py`, `documents/adapters/` |
| DI 조립 | `apps/api/app/bootstrap/container.py` |
| 설정 | `apps/api/app/core/config.py` |
| 패키지 계약·불변식 | `scaffold-engine/core/interfaces.py`, `core/pipeline.py` |

`workspaces`의 직접 파일 I/O와 `scaffolds/repository.py`는 이행 중인
옛 구조다. 새 코드의 본으로 삼지 않는다.

## 6. 완료 게이트

변경 뒤 아래를 실행한다.

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vibe/api test
```

- 각 게이트는 오류 0이어야 한다. 새 경고도 추가하지 않는다.
- 백엔드를 변경했다면 `python -c "import main"`과 실제 엔드포인트 호출을
  추가로 확인한다.
- 백엔드 경계 변경은 `ruff check`, `import-linter`, `pytest`를 통과해야 한다.
  아직 자동화가 없다면 해당 도입 작업을 변경 범위에 포함한다.
- 동작 변경은 실행으로 검증한다. 빌드 통과는 동작 검증이 아니다.
- 검증을 실행하지 않았거나 실패했다면 완료라고 보고하지 않는다.

## 7. 예외 처리

1. §3으로 돌아가 코드 위치와 의존 방향을 재설계한다.
2. 공통분모가 필요하면 하위 계층으로 내린다.
3. 둘 이상의 기능을 엮어야 하면 상위 계층에서 조합한다.
4. 그래도 불가능하면 코드를 우회하지 말고, 이유와 선택지를 사용자에게
   보고한다.

## 8. 커밋 규약

`type(scope): subject` 형식의 Conventional Commits를 사용한다.

```text
feat(canvas): 노드 다중 선택 정렬 기능 추가
fix(workspace): 세션 복원 시 빈 캔버스 덮어쓰기 방지
refactor(web): reference-document 위젯을 엔티티로 이관
docs(rules): 아키텍처 헌법 정리
```

`type`: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`.

## 9. 고정 기술 스택

| 영역 | 사용 | 새 도입 금지 |
| --- | --- | --- |
| 캔버스 | `@xyflow/react` | React-Konva, Fabric.js, Canvas API |
| 리치 텍스트 | Tiptap | Slate.js, Quill |
| 상태 | zustand | 새 상태 라이브러리 |
| 스타일 | Tailwind v4 + ShadCN | CSS-in-JS |
| 패키지 관리 | pnpm workspace | npm install, yarn |
| 빌드 오케스트레이션 | turbo | 루트의 개별 스크립트 실행 |

과거 문서에 다른 기술이 있어도 이 표를 따른다.

## 10. 상세 자료

판단이 서지 않을 때만 아래를 읽는다.

- [레이어 상세](./layers.md)
- [위반 사례](./examples/violation-catalog.md)
- [아키텍처 규칙](../10-architecture/)
- [모듈화 규칙](../20-modularity/)
- [개발 컨벤션](../50-develop/convention/)
