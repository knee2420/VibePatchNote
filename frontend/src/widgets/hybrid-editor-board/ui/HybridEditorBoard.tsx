import { useMemo } from 'react';
import { InfiniteCanvas } from '@/shared/ui/canvas/InfiniteCanvas';
import { SegmentNode } from '@/entities/segment/ui/SegmentNode';
import { ResourceCardNode } from '@/entities/resource-card/ui/ResourceCardNode';
import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';

export function HybridEditorBoard() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useHybridEditorState();

  // Define node types for React Flow
  const nodeTypes = useMemo(() => ({
    segment: SegmentNode,
    resourceCard: ResourceCardNode,
  }), []);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hybrid Editing Board</h1>
          <p className="text-sm text-slate-500">React Flow + Tiptap Integration</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-md hover:bg-blue-100 transition">
            + 챕터 추가
          </button>
          <button className="px-4 py-2 bg-amber-50 text-amber-600 font-medium rounded-md hover:bg-amber-100 transition">
            + 지식 카드 추가
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <InfiniteCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        />
      </div>
    </div>
  );
}
