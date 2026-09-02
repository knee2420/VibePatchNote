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
}

export function InfiniteCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  children,
  className = ''
}: InfiniteCanvasProps) {
  return (
    <div className={`w-full h-full min-h-[600px] bg-slate-50 ${className}`}>
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
