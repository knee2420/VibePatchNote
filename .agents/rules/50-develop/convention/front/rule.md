---
description: "프론트엔드 아키텍처, FSD, AHA 및 코딩 스타일 컨벤션"
---

# 🎨 Frontend Principles (apps/web)

이 문서는 `96.data_pipeline`을 인용하여 프론트엔드(`apps/web`) 앱 개발 시 지켜야 할 아키텍처 및 철학을 정의합니다.

## 1. Feature-Sliced Design (FSD) 레이어 준수
* **원칙:** 모든 UI와 비즈니스 로직은 도메인 역할에 따라 엄격한 수직 계층을 따릅니다.
* **계층 구조:** `app` ➔ `pages` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`
* **규칙:** 
  - 하위 레이어는 상위 레이어를 절대 Import 할 수 없습니다. (Cross-imports 금지)
  - 같은 레이어의 다른 슬라이스도 직접 Import 할 수 없습니다. (`features/A` → `features/B` 금지)
  - 각 슬라이스는 반드시 `index.ts` (Public API)를 통해서만 외부에 모듈을 노출합니다.
* **강제 수단:** 위 세 규칙은 `apps/web/.oxlintrc.json` 의 `no-restricted-imports` 레이어별 override 와 `import/no-cycle` 로 린트 단계에서 차단됩니다. `pnpm lint` 로 검증하세요.
* **인용:** [FSD - Layers](../../../../../workbench/96.data_pipeline/feature-sliced-design/src/content/docs/docs/reference/C-layers.md), [FSD - Public API](../../../../../workbench/96.data_pipeline/feature-sliced-design/src/content/docs/docs/reference/C-public-api.md)

## 2. AHA Programming 💡 (Avoid Hasty Abstractions)
* **원칙:** 섣부른 코드 공통화보다 코드 복제(Duplication)를 선호합니다.
* **적용 가이드:**
  - 두 개 이상의 컴포넌트가 비슷해 보인다고 즉시 `shared/`나 커스텀 훅으로 추출하지 마십시오.
  - 요구사항이 명확히 굳어지기 전까지는 코드를 인라인(Inline)으로 복제해 두고, **변경 용이성(Optimize for change)**을 최우선으로 확보하십시오.
* **인용:** [AHA Programming](../../../../../workbench/96.data_pipeline/aha-programming/01_core/C-01-01_aha_programming.md)

## 3. 코어 기술 스택 제한
* **원칙:** 무한 캔버스와 세그먼트 블록 조작을 위해 **`React Flow` + `Tiptap`**만을 사용합니다.
* **금지:** `React-Konva` 등 HTML5 Canvas 기반 엔진 사용 엄금.

## 4. Google TypeScript Style Guide
* **원칙:** 구글 스타일의 엄격한 TS 네이밍 및 파일 구조화 규칙을 따릅니다.
* **적용 가이드:**
  - 외부 라이브러리(NPM) Import 블록과 내부 모듈(`@/...`) Import 블록을 시각적으로 한 줄 띄워 분리합니다.
  - 인터페이스는 `PascalCase`, 변수와 함수는 `camelCase`를 준수합니다.
* **인용:** [Google TS - Source file structure](../../../../../workbench/96.data_pipeline/google-ts-style-guide/C-tsguide_03_source_file_structure.md)

## 5. 디렉터리 레이어별 상세 컨벤션 (Directory Breakdown)

### 5.1 src/app
- **역할:** 앱의 진입점(Entry Point), 글로벌 스타일(CSS), 폰트 세팅, 전역 Provider(Redux, React Query 등) 세팅.
- **규칙:** 비즈니스 로직을 포함하지 않으며, 오직 앱 구동을 위한 최상위 설정만 담당합니다.

### 5.2 src/pages
- **역할:** 라우팅(Routing) 기준이 되는 전체 페이지 뷰를 구성합니다.
- **규칙:** widgets나 features 레이어의 컴포넌트들을 조합(Composition)하는 역할만 수행하며, 상태(State)를 직접 관리하거나 로직을 무겁게 가지지 않습니다.

### 5.3 src/widgets
- **역할:** pages에서 사용할 독립적이고 재사용 가능한 거시적 UI 블록 (예: HybridEditorBoard, Header, Sidebar).
- **규칙:** 내부적으로 여러 features나 entities를 묶어서 하나의 완전한 기능을 수행하는 덩어리로 만듭니다.

### 5.4 src/features
- **역할:** 사용자 상호작용(User Interaction)이 발생하는 구체적인 비즈니스 로직 및 상태 제어
  (agent-run-panel, api-health, canvas-file-drop, canvas-node-actions, canvas-settings,
  canvas-toolbar, llm-settings, scaffold-focus, workspace).
- **규칙:** 단순히 보여주는 UI가 아니라 '동작(Action)'을 포함합니다.

### 5.5 src/entities
- **역할:** 시스템의 핵심 도메인 비즈니스 객체 및 기본 뷰
  (agent-run, canvas-board, llm-configuration, reference-document, resource-card,
  scaffold-document, segment, workspace-session).
- **규칙:** 외부 상태에 의존하지 않으며(순수함 지향), 가장 멍청한(Dumb) 형태의 데이터 모델과 UI 스켈레톤을 제공합니다.
- **⛔ 다른 애그리거트를 값으로 복사하지 않습니다.** 캔버스 노드 `data` 에는 `docId`·`scaffoldId`
  **포인터와 실행 상태만** 둡니다. 분석 결과·본문을 넣으면 재분석 시 정본과 갈라지고 세션 파일이
  부풉니다(실제로 349KB 까지 자랐습니다).
  정본: [`60-data/rule.md` §4-1](../../../60-data/rule.md) · 사례: [V-11](../../../00-core/examples/violation-catalog.md)

### 5.6 src/shared
- **역할:** 프로젝트 전반에서 쓰이는 순수 유틸리티, 공통 UI 컴포넌트(버튼, 모달), API 클라이언트,
  React Flow 캔버스 코어 설정, 영속화 화이트리스트(`lib/canvasPersistence.ts`) 등.
- **규칙:** 도메인 비즈니스 로직을 절대 포함해서는 안 됩니다. (AHA 원칙에 따라 섣부른 추상화 경계)
- **전송 프로토콜은 예외입니다.** `api/agentRunClient.ts` 는 Agent Runtime 실행 프로토콜을
  담습니다. 백엔드에서 `core/agent_runtime` 이 도메인이 아닌 것과 같은 이유이며, 여러 엔티티가
  같은 프로토콜을 쓰는데 한 엔티티가 소유하면 슬라이스 횡단이 생기기 때문입니다.
  **판단(상태 표현·재개 UI)은 `entities/agent-run` 이 갖습니다.**

---

## 6. 모노레포 공용 패키지 (`packages/*`) 분리 및 임포트 원칙
* **원칙:** 특정 애플리케이션의 화면 런타임(React Flow 캔버스 핸들, 전역 상태 등)에 종속되지 않고, **향후 여러 툴/클라이언트에서 공통으로 재사용될 순수 UI/도메인 엔진은 `packages/`로 격리 추출**합니다.
* **적용 사례 (`packages/document-viewer`):**
  - PDF 원클릭 가로 스프레드(Unfold) 뷰어 및 포맷별 전략 패턴 레지스트리 코어는 호스트 비의존적 패키지로 분리.
  - `apps/web`은 이를 `workspace:*` 의존성으로 등록하고, `entities/reference-document` 의 `ReferenceDocumentCard` 쉘에서 순수 라이브러리처럼 조합(Compose)하여 사용.
* **임포트 규칙:**
  - `apps/web`에서 공용 패키지를 가져올 때는 항상 Public API(`@vibe/[패키지명]`)를 통해서만 참조하며, 패키지 내부의 깊은 파일 경로(`@vibe/.../src/...`)를 직접 건드리지 않습니다.

