import { useRef } from 'react';
import { Tree, type TreeApi } from 'react-arborist';
import { Layers } from 'lucide-react';

import { BinderNode } from './BinderNode';
import type { BinderItem, BinderTreeProps } from './types';

/**
 * 스크리브너 스타일의 고성능 가상 스크롤 바인더(Binder) 트리 컴포넌트.
 * 대규모 문서 청크 노드를 계층적으로 관리하고 드래그 앤 드롭으로 순서를 재편할 수 있습니다.
 */
export function BinderTree<T = Record<string, unknown>>({
  data,
  selectedId,
  onSelect,
  onMove,
  onRename,
  onDelete,
  searchTerm,
  width = '100%',
  height = 500,
  indent = 16,
  rowHeight = 28,
  className = '',
  emptyText = '표시할 바인더 노드가 없습니다.',
  renderNode,
}: BinderTreeProps<T>) {
  const treeRef = useRef<TreeApi<BinderItem<T>> | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex flex-col items-center justify-center text-slate-500 gap-2 p-4">
        <Layers className="w-6 h-6 stroke-[1.5] opacity-60" />
        <p className="text-xs">{emptyText}</p>
      </div>
    );
  }

  const NodeComponent = (renderNode || BinderNode) as React.ComponentType<import('react-arborist').NodeRendererProps<BinderItem<T>>>;

  return (
    <div className={`w-full h-full overflow-hidden select-none ${className}`}>
      <Tree<BinderItem<T>>
        ref={treeRef}
        data={data}
        searchTerm={searchTerm}
        width={width}
        height={height}
        indent={indent}
        rowHeight={rowHeight}
        selection={selectedId || undefined}
        onSelect={(nodes) => {
          const selectedNode = nodes[0] || null;
          onSelect?.(selectedNode ? selectedNode.data : null, selectedNode);
        }}
        onMove={(args) => {
          onMove?.({
            dragIds: args.dragIds,
            dragNodes: args.dragNodes,
            parentId: args.parentId,
            parentNode: args.parentNode,
            index: args.index,
          });
        }}
        onRename={(args) => {
          onRename?.({
            id: args.id,
            name: args.name,
            node: args.node,
          });
        }}
        onDelete={(args) => {
          onDelete?.(args.ids);
        }}
      >
        {NodeComponent}
      </Tree>
    </div>
  );
}
