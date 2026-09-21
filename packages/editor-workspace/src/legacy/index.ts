// ============================================================================
// @vibe/editor-workspace / Legacy Web Components
// 구버전 웹 에디터(DocumentEditorWorkspace) 전용 컴포넌트들을 격리 보관합니다.
// ============================================================================

// 1. Workspace
export { WorkspaceShell } from './workspace';
export type { WorkspaceShellProps } from './workspace';

// 2. Toolbar & Menu
export { DocumentTopBar, TopMenuBar, ViewModeSwitch, SyncStatusBadge } from './toolbar';
export type {
  DocumentTopBarProps,
  TopMenuBarProps,
  ViewModeOption,
  ViewModeSwitchProps,
  SyncStatusType,
  SyncStatusBadgeProps,
} from './toolbar';

// 3. Panels
export { WorkspacePanel, PanelToolbar } from './panels';
export type { WorkspacePanelProps, PanelToolbarProps } from './panels';

// 4. Structural Views (Corkboard, Outliner, Scrivenings)
export { CorkboardView, CorkboardCardItem } from './corkboard';
export type { CorkboardCard, CorkboardViewProps } from './corkboard';

export { OutlinerTable } from './outliner';
export type { OutlinerRow, OutlinerProps } from './outliner';

export { ScriveningsView } from './scrivenings';
export type { ScriveningsChunk, ScriveningsViewProps } from './scrivenings';

// 5. Inspectors & Modals
export { SnapshotInspector } from './snapshots';
export type { DocumentSnapshot, SnapshotInspectorProps } from './snapshots';

export { MetadataInspector } from './metadata';
export type { DocumentMetadata, MetadataInspectorProps } from './metadata';

export { DocumentCompilerModal } from './compiler';
export type { CompilerSection, CompilerOptions, DocumentCompilerProps } from './compiler';

// 6. Navigation
export { QuickTabSwitcher, useKeyboardTabSwitch } from './navigation';
export type { QuickTabItem, QuickTabSwitcherProps } from './navigation';

// 7. Statusbar & Pagination
export { BreadcrumbBar } from './statusbar';
export type { BreadcrumbItem, BreadcrumbBarProps } from './statusbar';

export { PaginationBar } from './view-layout';
export type { PaginationBarProps } from './view-layout';
