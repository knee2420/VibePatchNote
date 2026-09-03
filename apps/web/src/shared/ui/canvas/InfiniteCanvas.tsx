import type { ReactNode } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  BackgroundVariant,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface InfiniteCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect?: OnConnect;
  nodeTypes?: NodeTypes;
  children?: ReactNode;
  className?: string;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  showDots?: boolean;
  showMiniMap?: boolean;
  isReadOnly?: boolean;
  canvasMode?: 'select' | 'hand';
}

export function InfiniteCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  children,
  className = '',
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  snapToGrid = true,
  snapGrid = [20, 20],
  showDots = true,
  showMiniMap = true,
  isReadOnly = false,
  canvasMode = 'select',
}: InfiniteCanvasProps) {
  return (
    <div 
      className={`w-full h-full min-h-[600px] bg-slate-50 relative ${className}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={canvasMode === 'hand' ? true : [1, 2]}
        selectionOnDrag={canvasMode === 'select' && !isReadOnly}
        selectionMode={SelectionMode.Partial}
        panActivationKeyCode="Space"
        fitView
      >
        {showDots && <Background variant={BackgroundVariant.Dots} gap={12} size={1} />}
        <Controls />
        {showMiniMap && <MiniMap />}
        {children}
      </ReactFlow>
    </div>
  );
}
