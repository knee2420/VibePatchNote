# @vibe/editor-workspace

> **Host-Agnostic, Domain-Neutral Workspace & AI Intelligence Engine**  
> VS Code 스타일의 무한 분할 도킹 셸(`dockview-react`), Scrivener 스타일의 다차원 소켓 바인더 트리(`react-arborist`), 4대 문서 뷰 캔버스(`view-layout`), 그리고 Antigravity(AGY) 영감의 **인라인 AI 플로팅 프롬프트·진단 퀵픽스·@ 멘션·계획 승인 거버넌스(`ai/`)**를 하나의 독립 모듈로 제공하는 차세대 범용 에디터 워크스페이스 패키지입니다.

---

## 🏛️ 2중 계층 아키텍처 (Two-Tier Architecture)

본 패키지는 **순수 에디터 렌더러인 `[CORE]`**와 **에디터와 1:1 결합되어 작동하는 `[AI]`**의 관심사를 엄격히 분리하여, AI가 필요 없는 환경에서는 순수 코어만 경량으로 import하고 AI가 필요한 환경에서는 지능형 하네스를 즉시 플러그인할 수 있습니다.

```text
packages/editor-workspace/
├── README.md               # 패키지 소개 및 빠른 시작
├── index.md                # 전체 컴포넌트 & API 카탈로그 인덱스
├── src/
│   ├── [CORE UI]           # 순수 워크스페이스 코어 (호스트 비의존적 Headless)
│   │   ├── workspace/      # 3단/4단 셸 레이아웃 (WorkspaceShell, WorkspacePanel)
│   │   ├── dock/           # 무한 분할 탭 도킹 뷰포트 (EditorDockShell, DockTabActions)
│   │   ├── view-layout/    # 4대 뷰(연속/A4낱장/양면/젠) & 줌/페이지 (PagedCanvasContainer, PaginationBar)
│   │   ├── navigation/     # 키보드 핫키(Ctrl+1~9) 고속 탭 전환 (QuickTabSwitcher, useKeyboardTabSwitch)
│   │   ├── binder/         # 루브릭 뼈대 ↔ 다차원 에셋 소켓 트리 (InteractiveSocketBinder, SpineSwitcher)
│   │   ├── outliner/       # 메타데이터 스프레드시트 뷰 (OutlinerTable)
│   │   ├── corkboard/      # 2D 인덱스 카드 조감 뷰 (CorkboardView, CorkboardCardItem)
│   │   ├── scrivenings/    # 다중 청크 연속 결합 스크롤 뷰 (ScriveningsView)
│   │   ├── metadata/       # 목표 분량 및 상태 인스펙터 (MetadataInspector)
│   │   ├── snapshots/      # 버전 복원점 스냅샷 관리자 (SnapshotInspector)
│   │   ├── compiler/       # 문서 일괄 조립 & 최종 포맷 컴파일러 (DocumentCompilerModal)
│   │   └── statusbar/      # 브레드크럼 & 글자수 상태바 (BreadcrumbBar, WordCountBadge)
│   │
│   └── [AI HARNESS]        # 안티그래비티 영감 AI 인텔리전스 스위트
│       └── ai/
│           ├── panel/      # 사이드바 AI 패널 종합 위젯 (AgentWorkspacePanel)
│           ├── inline/     # Ctrl+I 플로팅 인풋, 인라인 Diff 오버레이, 고스트 텍스트 (InlinePromptModal)
│           ├── lenses/     # 단락 플로팅 스마트 액션 렌즈 & 규격 충돌 AI 자동 수복 (DiagnosticQuickFix)
│           ├── mentions/   # 전역 컨텍스트 바인딩 @ 멘션 메뉴 & 훅 (ContextMentionMenu)
│           ├── planning/   # 파괴적 작업 전 계획 검토 & Proceed 3단 승인 (ExecutionPlanModal, PlanApprovalGate)
│           └── bridge/     # AI 인용 클릭 ➔ 원본 PDF 바운딩박스 자동 점프 & 사전 스냅샷 (WorkspaceAiBridge)
```

---

## 🚀 빠른 시작 (Quick Start)

### 1. 설치

```bash
# 모노레포 내부 설치
pnpm add @vibe/editor-workspace --filter <your-app>

# 타 프로젝트 독립 설치
npm install @vibe/editor-workspace
# 또는
pnpm add @vibe/editor-workspace
```

### 2. 코어 워크스페이스 조립 예시

```tsx
import {
  WorkspaceShell,
  WorkspacePanel,
  TopMenuBar,
  PagedCanvasContainer,
  PaginationBar,
  InteractiveSocketBinder,
} from '@vibe/editor-workspace';

export function MyEditor() {
  return (
    <WorkspaceShell
      header={<TopMenuBar title="프로젝트 사업계획서" />}
      leftSidebar={
        <WorkspacePanel title="루브릭 소켓 바인더">
          <InteractiveSocketBinder
            spines={[{ id: 'outline', label: 'Outline' }, { id: 'wireframe', label: 'Wireframe' }]}
            activeSpine="outline"
            onChangeSpine={(spine) => console.log(spine)}
            treeData={[]}
            stagingAssets={[]}
          />
        </WorkspacePanel>
      }
      center={
        <PagedCanvasContainer layoutMode="paged" zoom={100}>
          <div className="a4-document-paper">문서 본문 캔버스</div>
        </PagedCanvasContainer>
      }
      footer={<PaginationBar totalPages={10} currentPage={1} />}
    />
  );
}
```

### 3. 안티그래비티 AI 하네스 결합 예시

```tsx
import {
  AgentWorkspacePanel,
  InlinePromptModal,
  DocumentInlineLens,
  DiagnosticQuickFix,
} from '@vibe/editor-workspace';

export function MyAiEnabledEditor() {
  const [isInlineOpen, setIsInlineOpen] = useState(false);

  return (
    <>
      {/* 1. 단락 상단 스마트 렌즈 */}
      <DocumentInlineLens
        slotNumber={1}
        onTriggerAction={(actionId) => console.log(actionId)}
      />

      {/* 2. 규격 충돌 시 원클릭 AI 수복 버튼 */}
      <DiagnosticQuickFix
        issueType="conflict"
        issueMessage="원본 서식 규격과 세그먼트 데이터 충돌"
        onApplyFix={() => console.log('Auto fix applied')}
      />

      {/* 3. Ctrl + I 플로팅 지시창 */}
      <InlinePromptModal
        isOpen={isInlineOpen}
        selectedText="분석할 본문 단락..."
        onSubmit={(prompt) => console.log(prompt)}
        onClose={() => setIsInlineOpen(false)}
      />

      {/* 4. 우측 도킹 사이드바 AI 허브 */}
      <AgentWorkspacePanel
        activeTab="stream"
        onChangeTab={(tab) => console.log(tab)}
        composerProps={{
          value: '',
          onChange: () => {},
          onSubmit: (prompt) => console.log(prompt),
        }}
      />
    </>
  );
}
```

---

## 📖 전체 컴포넌트 및 상세 명세

모든 컴포넌트의 Props 인터페이스, 제네릭 타입 규격, 이벤트 훅 명세는 **[`index.md`](./index.md)** 문서를 참조하십시오.
