# @vibe/editor-workspace 마스터 카탈로그 인덱스 (Component & API Index)

> **패키지 위치**: `packages/editor-workspace`  
> **정체성**: 범용 문서 빌더, 스캐폴딩 엔진, 관측 시스템을 위한 **호스트 비의존적(Host-Agnostic) 코어 에디터 & AI 인텔리전스 스위트**

---

## 📑 목차

1. [아키텍처 원칙 (Core Principles)](#1-아키텍처-원칙-core-principles)
2. [전체 소스 디렉터리 트리 (Source Directory Tree)](#2-전체-소스-디렉터리-트리-source-directory-tree)
3. [[CORE] 코어 워크스페이스 컴포넌트 색인](#3-core-코어-워크스페이스-컴포넌트-색인)
   - [Workspace Layout (`workspace/`, `panels/`, `toolbar/`)](#31-workspace-layout)
   - [Dock Split Engine (`dock/`)](#32-dock-split-engine)
   - [Document View & Pagination (`view-layout/`)](#33-document-view--pagination)
   - [Navigation & Tab Switching (`navigation/`)](#34-navigation--tab-switching)
   - [Interactive Socket Binder (`binder/`)](#35-interactive-socket-binder)
   - [Structural Views (`outliner/`, `corkboard/`, `scrivenings/`)](#36-structural-views)
   - [Inspectors & Statusbar (`metadata/`, `snapshots/`, `compiler/`, `statusbar/`)](#37-inspectors--statusbar)
4. [[AI HARNESS] 안티그래비티 AI 인텔리전스 스위트 색인](#4-ai-harness-안티그래비티-ai-인텔리전스-스위트-색인)
   - [AI Panel Hub (`ai/panel/`)](#41-ai-panel-hub)
   - [Inline Modality (`ai/inline/`)](#42-inline-modality)
   - [Lenses & QuickFix (`ai/lenses/`)](#43-lenses--quickfix)
   - [Context Mentions (`ai/mentions/`)](#44-context-mentions)
   - [Planning Governance (`ai/planning/`)](#45-planning-governance)
   - [Interaction Bridge (`ai/bridge/`)](#46-interaction-bridge)
5. [타 프로젝트 이식 및 제네릭 타입 가이드](#5-타-프로젝트-이식-및-제네릭-타입-가이드)

---

## 1. 아키텍처 원칙 (Core Principles)

1. **완벽한 호스트 비의존성 (Host-Agnostic)**:
   - 본 패키지는 상위 앱(`apps/web`), 특정 백엔드 API(`@vibe/api`), 특정 상태관리자(Zustand/Redux)에 대한 직접 참조가 일체 없습니다.
   - 모든 데이터 모델은 제네릭 인터페이스(`<T = Record<string, unknown>>`)로 추상화되어 있습니다.
2. **2중 계층 분리 (Two-Tier Architecture)**:
   - 순수 레이아웃/렌더링 코어인 `[CORE]`와 지능형 에이전트 인터랙션을 담당하는 `[AI]`가 완전히 분리되어 있어, 선택적 도입(Opt-in)이 가능합니다.
3. **완전 제어 컴포넌트 (Controlled Component Standard)**:
   - 컴포넌트 내부에 닫힌 싱글톤을 숨기지 않고 표준 리액트 규격(`value`, `onChange`, `onSelect`)으로 설계되어 호스트가 상태를 100% 제어합니다.

---

## 2. 전체 소스 디렉터리 트리 (Source Directory Tree)

```text
packages/editor-workspace/src/
├── index.ts                      # 최상위 종합 Export Entry
│
├── [CORE UI]
│   ├── workspace/                # 3단 셸 레이아웃 (WorkspaceShell)
│   ├── dock/                     # 무한 분할 도킹 셸 (EditorDockShell, DockTabActions)
│   ├── view-layout/              # 4대 문서 뷰 및 줌 (PagedCanvasContainer, PaginationBar)
│   ├── navigation/               # 핫키 지원 고속 탭 전환 (QuickTabSwitcher, useKeyboardTabSwitch)
│   ├── binder/                   # 소켓 바인더 및 6대 하위 파츠
│   │   ├── spine/                # • 척추 관점 스위처 (SpineSwitcher)
│   │   ├── socket/               # • 소켓 노드 렌더러 & 뱃지 (SocketNodeRenderer, SocketStateBadge)
│   │   ├── staging/              # • 미매핑 에셋 대기소 트레이 (AssetStagingTray, StagingCard)
│   │   ├── provenance/           # • 소화율 링 & 출처 칩 (CoverageRing, ProvenanceChipList)
│   │   ├── bridge/               # • 교차 도메인 미러 뱃지 (CrossDomainBridgeTag)
│   │   └── actions/              # • 노드 인라인 액션 바 (NodeActionBar)
│   ├── outliner/                 # 메타데이터 스프레드시트 뷰 (OutlinerTable)
│   ├── corkboard/                # 2D 인덱스 카드 뷰 (CorkboardView, CorkboardCardItem)
│   ├── scrivenings/              # 다중 청크 연속 결합 뷰 (ScriveningsView)
│   ├── metadata/                 # 목표 분량 & 메타데이터 (MetadataInspector)
│   ├── snapshots/                # 스냅샷 복원점 관리자 (SnapshotInspector)
│   ├── compiler/                 # 산출물 컴파일러 (DocumentCompilerModal)
│   └── statusbar/                # 브레드크럼 & 단어수 상태바 (BreadcrumbBar, WordCountBadge)
│
└── [AI HARNESS]
    └── ai/
        ├── panel/                # 사이드바 AI 허브 (AgentWorkspacePanel)
        ├── inline/               # 인라인 플로팅 프롬프트, Diff, 고스트 (InlinePromptModal, InlineDiffOverlay)
        ├── lenses/               # 인라인 스마트 렌즈 & 규격 퀵픽스 (DocumentInlineLens, DiagnosticQuickFix)
        ├── mentions/             # 전역 @ 멘션 하네스 (ContextMentionMenu, useWorkspaceMention)
        ├── planning/             # 계획 사전 검토 & 3단 승인 (ExecutionPlanModal, PlanApprovalGate)
        └── bridge/               # AI ↔ 뷰어 바운딩박스 점프 & 자동 스냅샷 (WorkspaceAiBridge, usePreAiSnapshot)
```

---

## 3. [CORE] 코어 워크스페이스 컴포넌트 색인

### 3.1 Workspace Layout
* **`WorkspaceShell`** (`workspace/WorkspaceShell.tsx`)
  - 상단 헤더, 좌측 바인더, 중앙 에디터, 우측 인스펙터, 하단 상태바를 배치하는 Antigravity IDE 스타일 5대 영역 리사이징 셸.
* **`WorkspacePanel`** (`panels/WorkspacePanel.tsx`)
  - 사이드바와 인스펙터에 사용되는 표준 패널 프레임 (타이틀, 뱃지, 도구 버튼, 접기/펼침 내장).
* **`TopMenuBar`** (`toolbar/TopMenuBar.tsx`)
  - 좌(문서명/뒤로가기), 중(화면 모드 스위치), 우(상태/도구)를 갖춘 상단 메인 툴바.

### 3.2 Dock Split Engine
* **`EditorDockShell`** (`dock/EditorDockShell.tsx`)
  - `dockview-react` 기반의 상하/좌우 무한 분할, 탭 드래그 도킹 에디터 뷰포트.
* **`DockTabActions`** (`dock/DockTabActions.tsx`)
  - 에디터 탭 우측의 `[참조 뷰포트 고정 (Pin)]`, `[우측 분할 (Split Right)]`, `[최대화]`, `[닫기]` 액션 툴바.

### 3.3 Document View & Pagination
* **`PagedCanvasContainer`** (`view-layout/PagedCanvasContainer.tsx`)
  - 4대 문서 뷰 형태(`continuous`, `paged`, `spread`, `zen`)와 뷰포트 줌 배율(50%~200%)에 따라 내부 에디터 캔버스를 동적으로 정렬하는 반응형 컨테이너.
* **`PaginationBar`** (`view-layout/PaginationBar.tsx`)
  - 페이지 번호 점프, 이전/다음 네비게이션, 줌 슬라이더, 4대 뷰 레이아웃 모드 토글 바.

### 3.4 Navigation & Tab Switching
* **`QuickTabSwitcher`** (`navigation/QuickTabSwitcher.tsx`)
  - `Ctrl + 1` ~ `Ctrl + 9` 키보드 단축키 힌트와 뱃지가 포함된 상단 고속 탭 전환 칩 UI.
* **`useKeyboardTabSwitch`** (`navigation/useKeyboardTabSwitch.ts`)
  - 키보드 핫키(`Ctrl+1~9`, `Alt+방향키`, `Ctrl+[/]`)를 감지하여 활성 탭을 전환하는 제어 훅.

### 3.5 Interactive Socket Binder
* **`InteractiveSocketBinder`** (`binder/InteractiveSocketBinder.tsx`)
  - 아래 6대 파츠가 일체형으로 결합된 스크리브너 초월형 다차원 소켓 시스템:
    1. **`SpineSwitcher`** (`binder/spine/`): 트리의 기준 척추(Outline / Wireframe / Docs / Segment)를 즉각 교체하는 세그먼트 컨트롤.
    2. **`SocketNodeRenderer` & `SocketStateBadge`** (`binder/socket/`): `Empty` / `Filled` / `Conflict` / `Partial` 상태 뱃지 및 드래그 앤 드롭 소켓 하이라이트.
    3. **`AssetStagingTray` & `StagingCard`** (`binder/staging/`): 미매핑 추출 에셋들을 보관하는 서랍식 인박스 풀 및 노드로의 드래그 바인딩.
    4. **`CoverageRing` & `ProvenanceChipList`** (`binder/provenance/`): 원본 근거 소화율(%) SVG 원형 링 및 원천 출처 점프 칩.
    5. **`CrossDomainBridgeTag`** (`binder/bridge/`): `→ P.2 Right Card`, `← Sec 3.1` 등 도메인 축 간 양방향 미러 뱃지.
    6. **`NodeActionBar`** (`binder/actions/`): 노드 호버 시 합성/자동추천/매핑해제를 실행하는 인라인 파이프라인 트리거.

### 3.6 Structural Views
* **`OutlinerTable`** (`outliner/OutlinerTable.tsx`)
  - 문서 섹션 번호, 제목, 요약, 글자수, 상태, 라벨을 스프레드시트 형태로 조회하고 편집하는 뷰.
* **`CorkboardView`** (`corkboard/CorkboardView.tsx`)
  - 하위 섹션 노드들을 2D 그리드 인덱스 카드로 조감하고 순서를 재배치하는 뷰.
* **`ScriveningsView`** (`scrivenings/ScriveningsView.tsx`)
  - 여러 개의 분할된 문서 청크들을 하나의 긴 연속 스크롤 뷰로 결합하여 읽고 편집하는 뷰.

### 3.7 Inspectors & Statusbar
* **`MetadataInspector`** (`metadata/MetadataInspector.tsx`): 목표 글자 수 대비 달성률 프로그레스 바 및 상태/태그 관리.
* **`SnapshotInspector`** (`snapshots/SnapshotInspector.tsx`): 섹션 단위 타임스탬프 스냅샷 기록, 복원, diff 비교.
* **`DocumentCompilerModal`** (`compiler/DocumentCompilerModal.tsx`): 다중 섹션을 단일 산출물(Markdown/HTML/Text)로 합성·출력.
* **`BreadcrumbBar` & `WordCountBadge`** (`statusbar/`): 계층 탐색 경로 및 실시간 글자·단어 수 계산기.

---

## 4. [AI HARNESS] 안티그래비티 AI 인텔리전스 스위트 색인

### 4.1 AI Panel Hub (`ai/panel/`)
* **`AgentWorkspacePanel`**:
  - 도킹 및 슬라이딩 패널 형태의 완성형 AI 오케스트레이션 패널.
  - 내부 서브 모듈:
    - **`PromptComposer`**: 컨텍스트 칩 바 + 주력 모델(`Gemini-3.8-flash`, `Gemini-3.1-pro` 등) 선택기 + `Ctrl + Enter` 전송.
    - **`AgentStepStream`**: CoT 단계별 추론 아코디언(`StepThinkingAccordion`) 및 도구 호출 결과(`ToolCallCard`).
    - **`DiffApprovalView`**: AI 제안문 인라인/분할 Diff 대조 및 청크별 선별 수락/거절.
    - **`GroundingCitationBar`**: 원본 발췌 인용 뱃지(`[1]`, `[2]`) 및 팩트 신뢰도 스코어카드.
    - **`RunHistoryTimeline`**: 과거 시도(Attempt #1, #2) 롤백 타임라인 및 대안 브랜치 분기(`Fork`).

### 4.2 Inline Modality (`ai/inline/`)
* **`InlinePromptModal`**:
  - 텍스트를 드래그하고 `Ctrl + I`를 누르면 선택 영역 바로 위에 팝업되는 플로팅 지시창 (빠른 퀵 액션 프리셋 내장).
* **`InlineDiffOverlay`**:
  - 에디터 본문 위치에서 실시간으로 변경 전/후 텍스트를 오버레이 대조하고, <kbd>Ctrl+Enter</kbd>(수락) 또는 <kbd>Esc</kbd>(거절)로 반영.
* **`GhostTextPredictor`**:
  - 루브릭 규격 기반 다음 의도 예측 유령 텍스트 및 <kbd>Tab</kbd> 수락, 다음 빈 슬롯으로의 점프(`Tab to Jump`).

### 4.3 Lenses & QuickFix (`ai/lenses/`)
* **`DocumentInlineLens`**:
  - 단락/슬롯 헤더 상단에 작게 떠 있는 스마트 액션 렌즈 (`[세그먼트 합성]`, `[원문 대조 팩트체크]`, `[표 변환]`).
* **`DiagnosticQuickFix`**:
  - 바인더 소켓 충돌(Conflict) 또는 미할당 발생 시 나타나는 안티그래비티 스타일의 원클릭 AI 수복 전구 버튼.

### 4.4 Context Mentions (`ai/mentions/`)
* **`ContextMentionMenu`**:
  - 프롬프트 입력창에서 `@`를 입력하면 워크스페이스의 슬롯, 원본 PDF, 세그먼트, 스냅샷을 추천하는 팝업.
* **`useWorkspaceMention`**:
  - 텍스트 입력창에서 `@` 트리거를 감지하고 멘션 칩을 주입하는 제어 훅.

### 4.5 Planning Governance (`ai/planning/`)
* **`ExecutionPlanModal`**:
  - 에이전트가 대규모 파괴적 작업을 수행하기 전 사전에 수립한 `implementation_plan`을 트리/체크리스트 형태로 검토하는 모달.
* **`PlanApprovalGate`**:
  - `[Proceed (실행)]` / `[계획 수정 요청]` / `[거절]` 3단 승인 인터랙티브 배너.

### 4.6 Interaction Bridge (`ai/bridge/`)
* **`WorkspaceAiBridge`**:
  - AI가 생성한 문장의 인용 클릭 시 원본 PDF 뷰어의 해당 바운딩 박스(`box_2d`)로 화면을 자동 스크롤/포커싱하는 브라우저 표준 이벤트 버스.
* **`usePreAiSnapshot`**:
  - AI에게 대규모 생성을 지시하기 직전 현재 상태를 자동으로 스냅샷 캡처하여 원클릭 롤백을 보장하는 안전 훅.

---

## 5. 타 프로젝트 이식 및 제네릭 타입 가이드

다른 프로젝트(React 18/19 환경)에 `@vibe/editor-workspace`를 도입할 때는 다음과 같이 호스트의 자체 데이터 모델을 제네릭 파라미터로 바인딩하면 됩니다.

```tsx
import type { BinderItem, OutlinerRow } from '@vibe/editor-workspace';

// 호스트 프로젝트의 커스텀 비즈니스 메타데이터 정의
interface LegalClauseMetadata {
  clauseNumber: string;
  riskRating: 'low' | 'high';
  counterpartyNotes: string;
}

// 패키지 제네릭에 바인딩
type LegalBinderItem = BinderItem<LegalClauseMetadata>;
type LegalOutlinerRow = OutlinerRow<LegalClauseMetadata>;
```

모든 스타일은 Tailwind CSS 클래스와 호환되며, 전용 테마 CSS(`import '@vibe/editor-workspace/dist/index.css'`)를 통해 Antigravity / Slate 다크 테마를 기본 제공합니다.
