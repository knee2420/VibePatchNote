// Binder Tree & Binder Toolbar (react-arborist 기반 가상 스크롤 아웃라인/트리 엔진)
export { BinderTree } from './binder/BinderTree';
export { BinderNode } from './binder/BinderNode';
export { BinderToolbar } from './binder/BinderToolbar';
export type {
  BinderItem,
  BinderTreeProps,
  BinderMoveEvent,
  BinderRenameEvent,
  BinderToolbarProps,
} from './binder/types';

// Editor Dock Shell & Tab Actions (dockview 기반 멀티 스플릿 탭 & 도킹 에디터 엔진)
export { EditorDockShell } from './dock/EditorDockShell';
export { DockTabActions } from './dock/DockTabActions';
export type {
  EditorDockShellProps,
  DockPanelConfig,
  DockviewApi,
  DockviewReadyEvent,
  IDockviewPanel,
  IDockviewPanelProps,
  IDockviewPanelHeaderProps,
  IDockviewHeaderActionsProps,
  DockviewGroupPanel,
  DockviewDefaultTab,
} from './dock/types';

// Workspace Panels (사이드바 / 인스펙터 고정 Shell 패널 프레임 & 툴바)
export { WorkspacePanel } from './panels/WorkspacePanel';
export { PanelToolbar } from './panels/PanelToolbar';
export type {
  WorkspacePanelProps,
  PanelToolbarProps,
} from './panels/types';

// Top Menu Bar & Global Toolbar (상단 헤더 툴바, 뷰 모드 스위처, 동기화 배지)
export { TopMenuBar } from './toolbar/TopMenuBar';
export { ViewModeSwitch } from './toolbar/ViewModeSwitch';
export { SyncStatusBadge } from './toolbar/SyncStatusBadge';
export type {
  TopMenuBarProps,
  ViewModeOption,
  ViewModeSwitchProps,
  SyncStatusType,
  SyncStatusBadgeProps,
} from './toolbar/types';

// Navigation & Fast Tab Switching (키보드 단축키 지원 고속 탭 전환기)
export { QuickTabSwitcher } from './navigation/QuickTabSwitcher';
export { useKeyboardTabSwitch } from './navigation/useKeyboardTabSwitch';
export type {
  QuickTabItem,
  QuickTabSwitcherProps,
} from './navigation/types';

// View Layout & Pagination (4대 문서 뷰 형태, 줌, A4 낱장, 양면 펼침, 페이지네이션)
export { PaginationBar } from './view-layout/PaginationBar';
export { PagedCanvasContainer } from './view-layout/PagedCanvasContainer';
export type {
  PageLayoutMode,
  PaginationState,
  PaginationBarProps,
  PagedCanvasContainerProps,
} from './view-layout/types';

// Corkboard (스크리브너 스타일 2D 인덱스 카드 조감 뷰)
export { CorkboardView } from './corkboard/CorkboardView';
export { CorkboardCardItem } from './corkboard/CorkboardCardItem';
export type {
  CorkboardCard,
  CorkboardViewProps,
} from './corkboard/types';

// Outliner (스크리브너/데이터베이스 스타일 섹션 테이블 뷰)
export { OutlinerTable } from './outliner/OutlinerTable';
export type {
  OutlinerRow,
  OutlinerColumn,
  OutlinerProps,
} from './outliner/types';

// Metadata & Target Count (문서 메타데이터, 목표 분량 진행도 인스펙터)
export { MetadataInspector } from './metadata/MetadataInspector';
export type {
  DocumentMetadata,
  MetadataInspectorProps,
} from './metadata/types';

// Status Bar Widgets (브레드크럼, 글자 수 배지)
export { BreadcrumbBar } from './statusbar/BreadcrumbBar';
export { WordCountBadge } from './statusbar/WordCountBadge';
export type {
  BreadcrumbItem,
  BreadcrumbBarProps,
  WordCountBadgeProps,
} from './statusbar/types';

// Snapshots (세그먼트 단위 복원점 캡처 & 인라인 비교 인스펙터)
export { SnapshotInspector } from './snapshots/SnapshotInspector';
export type {
  DocumentSnapshot,
  SnapshotInspectorProps,
} from './snapshots/types';

// Document Compiler (복합 섹션 합성 및 출력 모달)
export { DocumentCompilerModal } from './compiler/DocumentCompilerModal';
export type {
  CompilerSection,
  CompilerOptions,
  DocumentCompilerProps,
} from './compiler/types';

// Scrivenings (다중 청크 연속 스크롤 복합 뷰)
export { ScriveningsView } from './scrivenings/ScriveningsView';
export type {
  ScriveningsChunk,
  ScriveningsViewProps,
} from './scrivenings/types';

// Workspace Shell (Antigravity IDE / Scrivener 스타일 3단 레이아웃 셸)
export { WorkspaceShell } from './workspace/WorkspaceShell';
export type { WorkspaceShellProps } from './workspace/WorkspaceShell';
