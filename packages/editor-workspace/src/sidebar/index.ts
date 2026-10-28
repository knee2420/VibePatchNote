// 1. Types
export type {
  IdeTreeNodeItem,
  IdeSegmentBlockData,
  IdeSegmentFieldData,
  IdeOutlineItemData,
  IdeHierarchyNode,
  HierarchyProjectionMode,
  SidebarViewMode,
  ReferenceDocumentItem,
  IdeArboristNodeData,
} from './types';

// 2. Core Primitives (슬롯 조립형 레고 블록)
export {
  IdeTreeRow,
  IdeFieldSocket,
  IdeSidebarSection,
  IdeTreeNode,
  IdeSegmentBlockItem,
  IdeSegmentField,
  IdeSidebarHeader,
  IdeArboristRow,
} from './primitives';
export type {
  IdeTreeRowProps,
  IdeFieldSocketProps,
  IdeSidebarSectionProps,
  IdeTreeNodeProps,
  IdeSegmentBlockItemProps,
  IdeSegmentFieldProps,
  IdeSidebarHeaderProps,
  IdeArboristRowCustomProps,
} from './primitives';

// 3. Engine & Container (단일 통합 계층 결합 엔진 및 react-arborist 가상화 트리)
export { IdeHierarchyTree } from './IdeHierarchyTree';
export type { IdeHierarchyTreeProps } from './IdeHierarchyTree';
export { IdeArboristTree } from './IdeArboristTree';
export type { IdeArboristTreeProps } from './IdeArboristTree';

// 4. Reference
export {
  IdeReferenceDocDrawer,
  FloatingReferenceWindow,
} from './reference';
export type {
  IdeReferenceDocDrawerProps,
  FloatingReferenceWindowProps,
} from './reference';

// 5. Composite Primary Sidebar
export { IdePrimarySidebar } from './IdePrimarySidebar';
export type { IdePrimarySidebarProps } from './IdePrimarySidebar';

// 6. Tree Builders & Transformers (정본 계층 트리 구축 파츠)
export {
  buildOutlineHierarchyTree,
  buildSegmentHierarchyTree,
  buildOutlineArboristTree,
  buildSegmentArboristTree,
  buildFileArboristTree,
  toSegmentFieldData,
} from './treeBuilders';
export type {
  RawOutlineHierarchyItem,
  RawSegmentItem,
  RawSlotItem,
  RawSlotBindingInfo,
  RawSegmentMappingItem,
  RawOutlineElementItem,
} from './treeBuilders';

