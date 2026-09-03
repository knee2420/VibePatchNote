---
description: "[최우선] 이 저장소에서 코드를 작성하는 모든 에이전트가 예외 없이 준수해야 하는 아키텍처 헌법"
priority: 0
applies_to: "모든 코드 변경 (apps/**, packages/**)"
---

# ⛔ 00-core — 아키텍처 헌법 (Architecture Constitution)

> **STOP.** 이 저장소에서 코드를 한 줄이라도 쓰거나 고치기 전에 이 문서를 끝까지 읽으십시오.
> 이 문서는 `.agents/rules/` 안에서 **가장 높은 우선순위(00)** 를 가집니다.
> 하위 번호대 문서(`10-architecture`, `20-modularity`, `30-workflow`, `50-develop`)와 내용이 충돌하면 **무조건 이 문서를 따릅니다.**

---

## 0. 이 문서의 사용법

| 상황 | 할 일 |
| --- | --- |
| 코드를 작성/수정하기 **전** | §2 불변 원칙 + §3 배치 결정표를 읽는다 |
| 코드를 어디에 둘지 모를 때 | §3 배치 결정표를 위에서부터 순서대로 적용한다 |
| 작업을 끝냈을 때 | §6 완료 게이트를 **실행**한다. 통과 못 하면 미완성이다 |
| 규칙을 지킬 수 없어 보일 때 | §7 예외 처리 절차를 따른다. **임의 우회 금지** |

---

## 1. 프로젝트 아키텍처 한 줄 요약

> **Turborepo 모노레포** 위에서, 프론트엔드는 **FSD(Feature-Sliced Design)**, 백엔드는 **도메인 패키지 구조**를 따른다.
> 모든 경계는 **린터가 에러로 강제**하며, 사람의 선의에 의존하지 않는다.

```text
VibePatchNote/
├── apps/
│   ├── web/    @vibe/web   — React 19 + Vite + Tailwind v4 + React Flow + Tiptap  → FSD
│   └── api/    @vibe/api   — FastAPI + Native Workflow Engine                     → 도메인 패키지
└── packages/
    ├── document-viewer/  @vibe/document-viewer — 호스트 비의존 문서 뷰어 엔진
    └── config/           @vibe/config          — 공통 TypeScript 설정
```

---

## 2. 불변 원칙 (Non-negotiable)

이 7가지는 **협상 대상이 아닙니다.** 위반한 코드는 머지 대상이 아닙니다.

| # | 원칙 | 한 줄 정의 |
| --- | --- | --- |
| **P1** | **단방향 의존** | 하위 레이어는 상위 레이어를 절대 참조하지 않는다. |
| **P2** | **슬라이스 격리** | 같은 레이어의 다른 슬라이스를 직접 참조하지 않는다. |
| **P3** | **Public API 경유** | 슬라이스 외부에서는 `index.ts`만 통해 접근한다. |
| **P4** | **로직/뷰 분리** | 통신·상태·검증은 훅(프론트)/서비스(백엔드)에. JSX와 라우터에 두지 않는다. |
| **P5** | **SSOT** | 같은 지식은 한 곳에만. 호스트·타입·상수를 복제하지 않는다. |
| **P6** | **AHA** | 섣부른 추상화보다 복제를 선호한다. 요구사항이 굳기 전엔 합치지 않는다. |
| **P7** | **자동 검증** | 완료 판정은 `pnpm lint && pnpm typecheck && pnpm build` 통과로만 내린다. |

> ⚠️ **P5와 P6은 충돌하는 것처럼 보이지만 아닙니다.**
> **P5(SSOT)** 는 *진실이 하나여야 하는 것* — 백엔드 주소, 도메인 타입, 노드 타입 키, 뷰어 엔진 — 에 적용합니다.
> **P6(AHA)** 는 *우연히 비슷해 보이는 것* — 컴포넌트 스타일 맵, 유사한 JSX 구조 — 에 적용합니다.
> 판단 기준: **"한쪽이 바뀌면 다른 쪽도 반드시 바뀌어야 하는가?"** → Yes면 SSOT로 통합, No면 복제 유지.

---

## 3. 배치 결정표 — "이 코드를 어디에 둘 것인가"

**위에서부터 순서대로** 적용하고, 처음 걸리는 곳에 둡니다.

### 3.1 프론트엔드 (`apps/web/src`)

```text
app → pages → widgets → features → entities → shared
─────────────────────────────────────────────▶  import 가능 방향은 오른쪽뿐
```

| 질문 | Yes면 여기에 |
| --- | --- |
| 여러 앱/툴에서 재사용될 호스트 비의존 엔진인가? | **`packages/<name>`** 으로 승격 (`@vibe/*`) |
| 도메인 지식이 전혀 없는 범용 자산인가? (버튼, `cn`, httpClient, env) | **`shared/{ui,lib,api,config,model}`** |
| 시스템의 핵심 도메인 객체 + 그 기본 표현인가? (세그먼트, 참고문서, 캔버스 그래프) | **`entities/<도메인>`** |
| 사용자의 **동작**이 있는가? (업로드한다, 검색한다, 저장한다, 정렬한다) | **`features/<동작>`** |
| 여러 feature/entity를 묶은 독립적인 화면 덩어리인가? | **`widgets/<블록>`** |
| 라우트에 1:1 대응하는 화면인가? | **`pages/<라우트>`** (조합만! 상태·통신 금지) |
| 전역 Provider / 라우팅 테이블 / 글로벌 CSS인가? | **`app/`** |

**현재 존재하는 슬라이스** (새로 만들기 전에 여기에 들어갈 자리가 있는지 먼저 확인):

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

### 3.2 슬라이스 내부 세그먼트

세그먼트 이름은 **아래로 고정**입니다. 임의의 폴더명(`handlers/`, `utils/`, `helpers/`)을 슬라이스 최상위에 만들지 마십시오.

| 세그먼트 | 담는 것 | 예 |
| --- | --- | --- |
| `ui/` | 컴포넌트 (렌더링과 이벤트 위임만) | `SessionListSheet.tsx` |
| `model/` | 스토어, 훅, 도메인 타입, 상수 | `useSessionSync.ts`, `types.ts` |
| `api/` | 백엔드 통신 함수 | `workspaceApi.ts` |
| `lib/` | 그 슬라이스 전용 순수 헬퍼 | `useNodeWheelScroll.ts` |
| `config/` | 그 슬라이스 전용 설정값 | — |
| `index.ts` | **Public API (필수)** | — |

> 하위 분류가 필요하면 세그먼트 **안에** 만듭니다: `model/handlers/pdf/index.ts` ✅ / `handlers/pdf/index.ts` ❌

### 3.3 백엔드 (`apps/api/app`)

| 질문 | Yes면 여기에 |
| --- | --- |
| 도메인 무관 인프라인가? (설정, 워크플로우 엔진, 에이전트 하네스) | **`core/`** |
| 여러 도메인이 공유하는 전역 Pydantic 모델인가? | **`models.py`** |
| 특정 도메인의 것인가? | **`<도메인>/`** — 아래 3분할 **필수** |

```text
app/<도메인>/
├── router.py    # HTTP 입출력만. 로직 금지. service 로 위임한다.
├── schemas.py   # Pydantic 요청/응답 모델. router.py 안에 인라인 선언 금지.
└── service.py   # 비즈니스 로직 전담.
```

---

## 4. 절대 금지 — 린터가 **에러**로 차단합니다

아래는 `apps/web/.oxlintrc.json`이 실제로 빌드를 실패시키는 항목입니다.

| 금지 | 잘못된 예 | 올바른 예 |
| --- | --- | --- |
| **상위 레이어 참조 (P1)** | `entities/segment` 에서 `import ... from '@/features/x'` | 필요한 값을 **props/인자로 주입**받는다 |
| **동일 레이어 횡단 (P2)** | `features/a` 에서 `import ... from '@/features/b'` | 공통분모를 `entities`/`shared`로 내리거나, 상위(widget)가 조합한다 |
| **슬라이스 내부 직접 참조 (P3)** | `import { X } from '@/features/workspace/ui/X'` | `import { X } from '@/features/workspace'` |
| **레거시 경로** | `@/components/ui/*`, `@/lib/utils` | `@/shared/ui`, `@/shared/lib` |
| **순환 참조** | A→B→A | 의존 방향을 단방향으로 재설계한다 |

추가로, 린터가 잡지 못하지만 **동일하게 금지**되는 것들:

| 금지 | 이유 | 대신 |
| --- | --- | --- |
| `fetch()` 직접 호출 | P5 위반. 호스트·에러처리가 흩어진다 | `shared/api` 의 `httpClient` |
| `'http://localhost:8000'` 하드코딩 | P5 위반. 배포 시 전부 깨진다 | `shared/config` 의 `env.apiBaseUrl` |
| 컴포넌트/라우터 안의 `useEffect` 통신 | P4 위반 | `features/*/model/use*.ts` 훅으로 분리 |
| 훅 안의 `alert`/`confirm`/`prompt` | P4 위반. 훅은 헤드리스여야 한다 | 콜백으로 UI에 위임 (`onUploadError` 패턴) |
| 노드 타입 문자열 리터럴 (`'referenceDocument'` 등) | P5 위반. 영속 데이터의 키다 | `REFERENCE_DOCUMENT_NODE_TYPE` 상수 |
| `index.ts` 없는 슬라이스 | P3 위반 | 슬라이스 생성 시 **동시에** 만든다 |
| **린트 규칙 비활성화 주석** | 규칙을 무력화하면 강제 수단이 사라진다 | §7 절차를 따른다 |

> 🚫 **`oxlint-disable` / `eslint-disable` 주석으로 경계 규칙을 우회하는 것은 그 자체가 최상위 위반입니다.**
> 경계 에러는 "설계가 틀렸다"는 신호이지, "주석으로 끌 것"이 아닙니다.

---

## 5. 정본 참조 구현 (Reference Implementations)

새 코드를 쓰기 전에 **같은 종류의 기존 코드를 먼저 읽고 그 모양을 따르십시오.**

| 하려는 일 | 정본으로 삼을 파일 |
| --- | --- |
| 백엔드 통신 추가 | `apps/web/src/features/workspace/api/workspaceApi.ts` |
| 헤드리스 훅 작성 | `apps/web/src/features/workspace/model/useSessionSync.ts` |
| 두 엔티티에 걸친 액션 | `apps/web/src/features/workspace/model/useSessionActions.ts` |
| 엔티티 + 노드 타입 상수 | `apps/web/src/entities/reference-document/model/types.ts` |
| 위젯 조합 | `apps/web/src/widgets/hybrid-editor-board/ui/HybridEditorBoard.tsx` |
| 페이지 (조합만) | `apps/web/src/pages/editor/ui/EditorPage.tsx` |
| 반복 UI의 원자 분리 | `apps/web/src/features/canvas-toolbar/ui/ToolDockButton.tsx` |
| 백엔드 도메인 3분할 | `apps/api/app/workspaces/` 의 `router.py` / `schemas.py` / `service.py` |
| 백엔드 설정 | `apps/api/app/core/config.py` |

---

## 6. 완료 게이트 (Definition of Done)

**아래를 실행해서 전부 통과해야 작업이 끝난 것입니다.** "코드를 작성했다"는 완료가 아닙니다.

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm build
```

| 게이트 | 통과 기준 |
| --- | --- |
| `pnpm lint` | **에러 0.** 경고는 허용하되 새로 늘리지 않는다 |
| `pnpm typecheck` | 에러 0. `strict: true` 기준 |
| `pnpm build` | 전 워크스페이스 성공 |
| 백엔드를 건드렸다면 | 앱이 임포트되고, 변경한 엔드포인트를 실제 호출해 확인 |
| 동작을 바꿨다면 | **실제로 실행해서 확인한다.** 빌드 통과 ≠ 동작 확인 |

**보고 규칙:** 게이트를 실행하지 않았으면 "완료"라고 쓰지 마십시오. 실패했으면 실패했다고 그대로 보고하십시오.

---

## 7. 예외 처리 절차

규칙을 지키면서는 요구사항을 구현할 수 없다고 판단되면, **순서대로** 시도합니다.

1. **재설계** — 대부분의 경계 에러는 코드 위치가 틀렸다는 뜻입니다. §3 결정표로 배치를 다시 판단하십시오.
2. **하향 이동** — 두 슬라이스가 같은 것을 필요로 하면, 그 공통분모를 **아래 레이어로 내립니다.**
   (실제 사례: `NodeTheme` 타입이 `features/canvas-node-actions`에 있어 `entities`가 참조해야 했던 문제 → `shared/model`로 하향 이동해 해결)
3. **상향 조합** — 두 feature를 엮어야 하면, **상위 widget이 둘을 조합**하게 만듭니다.
4. **그래도 불가능하면** — 코드를 바꾸지 말고 **사용자에게 물으십시오.** 무엇이 왜 막히는지, 어떤 선택지가 있는지 제시하고 판단을 받으십시오.

> 규칙을 조용히 우회한 코드보다, 막혔다고 보고하는 편이 언제나 낫습니다.

---

## 8. 커밋 규약

`type(scope): subject` — Conventional Commits.

```text
feat(canvas): 노드 다중 선택 정렬 기능 추가
fix(workspace): 세션 복원 시 빈 캔버스 덮어쓰기 방지
refactor(web): reference-document 위젯을 엔티티로 이관
chore(config): 공통 tsconfig 패키지 분리
docs(rules): 아키텍처 헌법 추가
```

`type`: `feat` `fix` `refactor` `chore` `docs` `test` `perf`
`scope`: `web` `api` `canvas` `workspace` `viewer` `config` `rules` 등 변경 범위

---

## 9. 기술 스택 고정 (변경 금지)

| 영역 | 확정 스택 | 금지 |
| --- | --- | --- |
| 캔버스 | `@xyflow/react` (React Flow) | `React-Konva`, `Fabric.js`, 순수 Canvas API |
| 리치 텍스트 | `Tiptap` | `Slate.js`, `Quill` |
| 상태 | `zustand` | 새 상태 라이브러리 도입 |
| 스타일 | `Tailwind v4` + ShadCN | 별도 CSS-in-JS 도입 |
| 패키지 매니저 | `pnpm` (workspace) | `npm install`, `yarn` — 락파일이 갈라진다 |
| 빌드 오케스트레이션 | `turbo` | 루트에서 개별 스크립트 직접 실행 |

과거 기획 문서에 다른 기술(React-Konva 등)이 남아 있더라도 **무시하고 위 표를 따릅니다.**

---

## 10. 더 읽을 것

이 문서로 판단이 서지 않을 때만 펼칩니다.

| 문서 | 다루는 것 |
| --- | --- |
| [`00-core/layers.md`](./layers.md) | 레이어별 상세 정의 + ✅/❌ 코드 대조 |
| [`00-core/examples/violation-catalog.md`](./examples/violation-catalog.md) | 실제 발생했던 위반 사례와 수정 방법 |
| [`10-architecture/`](../10-architecture/) | 기능 중심 분할, 헤드리스 로직, 확정 기술 스택 |
| [`20-modularity/`](../20-modularity/) | 원자 컴포넌트, Plug&Play, ShadCN 우선 |
| [`50-develop/convention/`](../50-develop/convention/) | 프론트/백엔드 세부 컨벤션 |
