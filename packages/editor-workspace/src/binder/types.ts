import type { NodeApi, NodeRendererProps } from 'react-arborist';

/** 바인더 트리의 범용 노드 데이터 모델. */
export interface BinderItem<T = Record<string, unknown>> {
  id: string;
  name: string;
  children?: BinderItem<T>[];
  isFolder?: boolean;
  data?: T;
}

export interface BinderMoveEvent<T = Record<string, unknown>> {
  dragIds: string[];
  dragNodes: NodeApi<BinderItem<T>>[];
  parentId: string | null;
  parentNode: NodeApi<BinderItem<T>> | null;
  index: number;
}

export interface BinderRenameEvent<T = Record<string, unknown>> {
  id: string;
  name: string;
  node: NodeApi<BinderItem<T>>;
}

export interface BinderTreeProps<T = Record<string, unknown>> {
  data: BinderItem<T>[];
  selectedId?: string | null;
  onSelect?: (item: BinderItem<T> | null, node: NodeApi<BinderItem<T>> | null) => void;
  onMove?: (event: BinderMoveEvent<T>) => void;
  onRename?: (event: BinderRenameEvent<T>) => void;
  onDelete?: (ids: string[]) => void;
  searchTerm?: string;
  width?: number | string;
  height?: number;
  indent?: number;
  rowHeight?: number;
  className?: string;
  emptyText?: string;
  renderNode?: React.ComponentType<NodeRendererProps<BinderItem<T>>>;
}

/** 바인더 상단 전용 툴바 Props */
export interface BinderToolbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onAddDocument?: () => void;
  onAddFolder?: () => void;
  onCollapseAll?: () => void;
  showSearch?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}
