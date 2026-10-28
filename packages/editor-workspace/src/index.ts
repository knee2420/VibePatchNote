// ============================================================================
// @vibe/editor-workspace (Main IDE Engine & Intelligence Suite)
// ============================================================================

// 1. [IDE Shell] 최상단 윈도우 헤더 및 메뉴바 (Desktop IDE Mode)
export {
  IdeWindowHeader,
  IdeBrandLogo,
  IdeMenuBar,
  IdeTitleHeader,
  IdePanelToggleGroup,
  WindowControlButtons,
} from './toolbar';
export type {
  IdeBrandLogoProps,
  IdeHeaderMenuItem,
  IdeMenuBarProps,
  IdeTitleHeaderProps,
  IdePanelToggleGroupProps,
  WindowControlButtonsProps,
  IdeWindowHeaderProps,
} from './toolbar';

// 2. [IDE Shell] 최좌측 액티비티 바
export {
  IdeActivityBar,
  DEFAULT_ACTIVITY_BAR_ITEMS,
  IdeActivityBarItem,
  IdeActivityBarAction,
} from './activity-bar';
export type {
  ActivityBarSide,
  ActivityBarItemVariant,
  ActivityBarItemConfig,
  IdeActivityBarItemProps,
  IdeActivityBarActionProps,
  IdeActivityBarProps,
} from './activity-bar';

// 3. [IDE Shell] 윈도우 프레임 및 분할 도킹 레이아웃
export {
  IdeWindowShell,
  IdeDockLayout,
  IdeResizerHandle,
  usePanelResize,
  useIdeLayoutState,
} from './workspace';
export type {
  IdeWindowShellProps,
  IdeDockLayoutProps,
  IdeResizerHandleProps,
  ResizerOrientation,
  ResizerColorVariant,
  UsePanelResizeOptions,
  UsePanelResizeReturn,
  IdeLayoutStateConfig,
  IdeLayoutStateReturn,
} from './workspace';

// 4. [IDE Binder] 좌측 사이드 패널 & react-arborist 고속 가상화 트리 엔진
export {
  // Primitives
  IdeTreeRow,
  IdeFieldSocket,
  IdeSidebarSection,
  IdeTreeNode,
  IdeSegmentBlockItem,
  IdeSegmentField,
  IdeSidebarHeader,
  IdeArboristRow,
  // Engine & Container
  IdeHierarchyTree,
  IdeArboristTree,
  // Reference
  IdeReferenceDocDrawer,
  FloatingReferenceWindow,
  // Composite
  IdePrimarySidebar,
  // Tree Builders (정본 계층 트리 구축 파츠)
  buildOutlineHierarchyTree,
  buildSegmentHierarchyTree,
  buildOutlineArboristTree,
  buildSegmentArboristTree,
  buildFileArboristTree,
  toSegmentFieldData,
} from './sidebar';
export type {
  IdeTreeRowProps,
  IdeFieldSocketProps,
  IdeSidebarSectionProps,
  IdeTreeNodeProps,
  IdeSegmentBlockItemProps,
  IdeSegmentFieldProps,
  IdeSidebarHeaderProps,
  IdeArboristRowCustomProps,
  IdeHierarchyTreeProps,
  IdeArboristTreeProps,
  IdeReferenceDocDrawerProps,
  FloatingReferenceWindowProps,
  IdePrimarySidebarProps,
  IdeTreeNodeItem,
  IdeSegmentBlockData,
  IdeSegmentFieldData,
  IdeOutlineItemData,
  IdeHierarchyNode,
  HierarchyProjectionMode,
  SidebarViewMode,
  ReferenceDocumentItem,
  IdeArboristNodeData,
  RawOutlineHierarchyItem,
  RawSegmentItem,
  RawSlotItem,
  RawSlotBindingInfo,
  RawSegmentMappingItem,
  RawOutlineElementItem,
} from './sidebar';

// 5. [IDE Canvas & Viewport]
export { PagedCanvasContainer } from './view-layout';
export type {
  PageLayoutMode,
  PaginationState,
  PagedCanvasContainerProps,
} from './view-layout';

// 6. [IDE Statusbar]
export { WordCountBadge } from './statusbar';
export type { WordCountBadgeProps } from './statusbar';

// 7. [AI Intelligence Suite] AI 오케스트레이션 패널 및 인라인 렌즈
export {
  AgentWorkspacePanel,
  PromptComposer,
  ContextTagBar,
  ModelConfigBadge,
  AgentStepStream,
  StepThinkingAccordion,
  ToolCallCard,
  ProviderExecutionBadge as AiProviderExecutionBadge,
  DiffApprovalView,
  InlineDiffViewer,
  ChunkActionGroup,
  SafetyApprovalGate,
  GroundingCitationBar,
  CitationBadge,
  FaithfulnessScoreCard,
  MissingEvidenceAlert,
  RunHistoryTimeline,
  AttemptStepNavigator,
} from './ai-panel';
export type {
  ContextTagItem,
  RecipePresetItem,
  ModelConfig,
  ContextTagBarProps,
  ModelConfigBadgeProps,
  PromptComposerProps,
  ToolCallItem,
  ProviderExecutionInfo,
  AgentExecutionStep,
  StepThinkingAccordionProps,
  ToolCallCardProps,
  ProviderExecutionBadgeProps,
  AgentStepStreamProps,
  DiffStatus,
  DiffChunkItem,
  InlineDiffViewerProps,
  ChunkActionGroupProps,
  SafetyApprovalGateProps,
  DiffApprovalViewProps,
  CitationItem,
  GroundingScoreItem,
  CitationBadgeProps,
  FaithfulnessScoreCardProps,
  MissingEvidenceAlertProps,
  GroundingCitationBarProps,
  RunAttemptItem,
  AttemptStepNavigatorProps,
  RunHistoryTimelineProps,
  AgentPanelTab,
  AgentWorkspacePanelProps,
} from './ai-panel';

export {
  // Inline AI
  InlinePromptModal,
  InlineDiffOverlay,
  GhostTextPredictor,
  // Lenses & QuickFix
  DocumentInlineLens,
  DiagnosticQuickFix,
  // Mentions
  ContextMentionMenu,
  useWorkspaceMention,
  // Planning Mode
  ExecutionPlanModal,
  PlanApprovalGate,
  // Bridge & Checkpointing
  WorkspaceAiBridge,
  usePreAiSnapshot,
} from './ai';

export type {
  InlinePromptModalProps,
  InlineDiffOverlayProps,
  GhostTextPredictorProps,
  DocumentLensAction,
  DocumentInlineLensProps,
  DiagnosticQuickFixProps,
  MentionItem,
  ContextMentionMenuProps,
  UseWorkspaceMentionReturn,
  PlanStepItem,
  PlanDecision,
  PlanApprovalGateProps,
  ExecutionPlanModalProps,
  AiViewerJumpPayload,
  PreAiSnapshotOptions,
  UsePreAiSnapshotReturn,
} from './ai';

// ============================================================================
// 8. [Legacy Web Components] (Deprecated - Isolated in src/legacy)
// 구버전 웹 에디터(DocumentEditorWorkspace) 전용 컴포넌트 하위 호환 re-export
// ============================================================================
export * from './legacy';
