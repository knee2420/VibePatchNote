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
│   └── api/  FastAPI · 헥사고날 도메인 · Agent Runtime
│       ├── config/  data/  cache/  state/   ← 런타임 데이터 (수명주기 등급)
│       └── migrations/                      ← 저장 레이아웃 마이그레이션
└── packages/
    ├── scaffold-engine       Python 문서 분석 엔진
    ├── document-viewer       문서 뷰어
    ├── tiptap-scaffold       스캐폴드 편집기
    └── config                TypeScript 설정
```

- 앱은 수직 계층(HTTP → 유스케이스 → 인프라)으로 나눈다.
- 패키지는 수평 파이프라인(측정 → 판정 → 조립 → 채점)으로 나눈다.
- 따라서 앱의 레이어 규칙을 패키지에 그대로 적용하지 않는다.
- 런타임 데이터는 **수명주기 등급**으로 나눈다. 디렉터리 이름이 곧
  "지워도 되는가 / 백업하는가"의 답이다. 정본은 [`60-data/rule.md`](../60-data/rule.md).
- 프론트 경계는 `oxlint`가, 백엔드 경계는 `ruff` + `import-linter`(계약 6건)가
  강제한다. 둘 다 `pnpm lint`에서 실행된다.

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
features/  agent-run-panel, api-health, canvas-file-drop, canvas-node-actions,
           canvas-settings, canvas-toolbar, llm-settings, scaffold-focus, workspace
entities/  agent-run, canvas-board, llm-configuration, reference-document,
           resource-card, scaffold-document, segment, workspace-session
shared/    api, config, lib, model, ui
```

### 3.2 백엔드: `apps/api/app`

```text
bootstrap → <domain> → core → packages/scaffold-engine
```

화살표 오른쪽으로만 import한다.

- `bootstrap/`: 객체 그래프 조립. 실제 구현체 선택과 **저장 등급 루트 주입**은
  여기서만 한다.
- `<domain>/`: HTTP, 유스케이스, 계약, 구현을 함께 둔다.
- `core/`: 로깅, LLM 실행·관측, Agent Runtime, 저장 게이트 같은 도메인 무관 인프라.
- `core/`가 도메인 import, 도메인 고유 명사, 프롬프트 문자열을 가지면
  위반이다.
- **도메인 간 직접 참조는 전부 금지한다.** 다른 도메인의 동작이 필요하면
  자기 `ports.py`에 계약을 정의하고 컨테이너가 구현체를 주입한다
  (예: `documents`가 스캐폴드를 지울 때 쓰는 `ScaffoldArchivePort`).
- `workspaces`는 본문을 소유하지 않고 `docId`, `scaffoldId` 포인터만 보관한다.

도메인은 아래 구조를 따른다. 세그먼트 이름은 고정이며 임의로 늘리지 않는다.

```text
app/<domain>/
├── __init__.py   # 외부 공개 API
├── router.py     # HTTP 입출력과 서비스 호출
├── schemas.py    # 요청·응답 Pydantic 모델
├── models.py     # (해당하면) 이 도메인의 프레임워크 독립 모델
├── errors.py     # (해당하면) 실패를 UI 계약으로 번역
├── service.py    # 유스케이스로 넘기는 얇은 경계
├── ports.py      # 외부 의존 계약(Protocol)
├── use_cases/    # 유스케이스 하나당 파일 하나
├── agents/       # (해당하면) LLM 이 개입하는 업무 정의
└── adapters/     # 파일·DB·외부 API 구현
```

`use_cases/`는 두 갈래로 나뉜다. **LLM 이 개입하는가**가 그 경계다.

| 갈래 | 특징 | 산출물 |
| --- | --- | --- |
| 일반 | Agent Runtime 을 쓰지 않는다 | 결정적이면 `cache/` 가능 |
| Agent | `<domain>/agents/` + `core/agent_runtime` 경유 | `data/` 에 provenance 동반 아티팩트 |

- 라우터에는 비즈니스 로직, DB·파일 접근, 함수 내부 import를 두지 않는다.
- 서비스는 구체 클래스가 아닌 `ports.py`의 `Protocol`에 의존한다.
- 어댑터 선택과 서비스 생성은 `bootstrap/container.py`에서만 한다.
- 모듈 전역 싱글턴은 만들지 않는다.
- 프롬프트는 실행하는 도메인의 `prompts.py` 또는 엔진이 소유한다.
- `storage.py`, `utils.py`, `helpers.py` 같은 모호한 최상위 파일은
  도메인에 만들지 않는다. 이름이 역할을 말해야 한다.

#### DI·포트·HTTP 경계의 기준

- 이 저장소의 DI 컨테이너 표준은 `dependency-injector`다. 새 서비스와
  어댑터는 컨테이너의 provider로 조립하고, 라우터는 주입받은 서비스만 쓴다.
- 파일·DB·LLM·외부 API·다른 도메인처럼 교체 가능하거나 외부 I/O를 하는
  의존성은 반드시 포트(`Protocol`)로 표현한다.
- 다른 도메인의 동작이 필요하면 구현을 가져오지 말고 **자기 포트로 정의**한다.
  구현체는 컨테이너가 주입한다. 이 역전이 없으면 도메인 간 결합이 생긴다.
- `router.py`만 FastAPI의 `UploadFile`, `Request`, `HTTPException`을 안다.
  서비스는 프레임워크 타입 대신 명시적 입력값과 도메인 오류를 사용한다.
- 서비스와 유스케이스는 저장 형식과 파일 경로를 직접 다루지 않는다.
  등급 루트는 `core/storage`가, 그 안의 레이아웃은 도메인 어댑터가 소유한다.
  `app.core.config`를 유스케이스·서비스·에이전트에서 import 하면
  `import-linter` 계약이 막는다.

### 3.3 공용 패키지: `packages/*`

- `packages/*`는 `apps/*`를 import하지 않는다.
- 앱과 패키지가 공유하는 계약의 정본은 패키지다.
- 앱에서는 패키지의 Public API만 import한다.
- 파이프라인 불변식은 패키지 `README.md` 또는 진입 모듈 docstring에
  기록한다.
- 호스트에 독립적이고, 재사용 가능하며, 라이브러리 API 또는 CLI 진입점이
  있을 때만 패키지로 승격한다.

외부 Dify 클라이언트에 의존하지 않는다. 분석 파이프라인의 정본은
`scaffold-engine`이고, 실행 제어의 정본은 `core/agent_runtime`이다.
(과거의 `app/core/workflow/`는 제거되었다. 새로 만들지 않는다.)

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
- 모델명·타임아웃·외부 URL·CORS는 `core/config.py`의 `settings`로 관리한다.
  **저장 경로는 `settings`에 두지 않는다.** 등급 루트는 `core/storage`가 소유하고,
  어댑터는 주입받은 루트만 쓴다.
- 산출물 존재는 파일 유무가 아니라 **채택본 포인터**(`HEAD.json`)와
  **출처**(`provenance.json`)로 판단한다. LLM 산출물은 provenance 없이 존재할 수 없다.
- LLM 산출물을 `cache/`에 두지 않는다. 재현되지 않고 비용이 드는 것은 캐시가 아니다.
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
| 유스케이스 (일반) | `documents/use_cases/register_document.py` |
| Agent | `documents/agents/extract_outline.py` |
| 포트·어댑터 | `documents/ports.py`, `documents/adapters/` |
| Agent 정의 | `documents/agents/outline_analysis_agent.py` |
| 실행 상태·재개 | `apps/api/app/core/agent_runtime/` |
| DI 조립 | `apps/api/app/bootstrap/container.py` |
| 설정 | `apps/api/app/core/config.py` |
| 저장 등급 게이트 | `apps/api/app/core/storage/paths.py` |
| 저장 마이그레이션 | `apps/api/migrations/` |
| 패키지 계약·불변식 | `scaffold-engine/core/interfaces.py`, `core/pipeline.py` |

## 6. 완료 게이트

변경 뒤 아래를 실행한다.

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vibe/api test
```

- 각 게이트는 오류 0이어야 한다. 새 경고도 추가하지 않는다.
  (`pnpm lint`가 `ruff`와 `import-linter` 계약까지 함께 실행한다.)
- 백엔드를 변경했다면 `python -c "import main"`과 실제 엔드포인트 호출을
  추가로 확인한다.
- **저장 레이아웃을 바꿨다면** `pnpm -F @vibe/api migrate:status`로 버전을 확인하고,
  마이그레이션 단계를 `migrations/`에 추가했는지 점검한다. 버전이 어긋나면
  서버는 부팅을 거부한다.
- 동작 변경은 실행으로 검증한다. 빌드 통과는 동작 검증이 아니다.
  화면 동작이 바뀐 경우의 검증 수단은 [`30-workflow/workflow-principles.md`](../30-workflow/workflow-principles.md) §2를 따른다.
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
- [아키텍처 규칙](../10-architecture/) — Agent Runtime 경계 포함
- [모듈화 규칙](../20-modularity/)
- [개발 컨벤션](../50-develop/convention/)
- [**데이터 관리**](../60-data/rule.md) — 수명주기 등급, 아티팩트, 실행 상태, 마이그레이션
