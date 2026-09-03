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
  BackgroundVariant
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
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
        {children}
      </ReactFlow>
    </div>
  );
}
