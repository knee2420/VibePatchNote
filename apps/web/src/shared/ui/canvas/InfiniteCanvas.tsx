import { useState, type ReactNode } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CtrlWheelZoomController } from './CtrlWheelZoomController';

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

const DEFAULT_SNAP_GRID: [number, number] = [20, 20];
const DEFAULT_EDGE_OPTIONS = { type: 'smoothstep', animated: false };

/**
 * 도메인 지식이 없는 범용 무한 캔버스 셸.
 *
 * 커서/패닝 관련 전역 CSS 는 `app/styles/index.css` 의 `.canvas-mode-*` 규칙이 담당합니다.
 */
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
  snapGrid = DEFAULT_SNAP_GRID,
  showDots = true,
  showMiniMap = true,
  isReadOnly = false,
  canvasMode = 'select',
}: InfiniteCanvasProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  return (
    <div
      className={`w-full h-full min-h-[600px] bg-slate-50 relative canvas-mode-${canvasMode} ${
        isSelecting ? 'is-selecting' : ''
      } ${className}`}
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
        onSelectionStart={() => setIsSelecting(true)}
        onSelectionEnd={() => setIsSelecting(false)}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={canvasMode === 'hand' ? true : [1, 2]}
        selectionOnDrag={canvasMode === 'select' && !isReadOnly}
        selectionMode={SelectionMode.Partial}
        panActivationKeyCode="Space"
        nodeDragThreshold={2}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        elevateNodesOnSelect={false}
        onlyRenderVisibleElements={true}
        deleteKeyCode={null}
        selectionKeyCode={null}
        fitView
      >
        <CtrlWheelZoomController />
        {showDots && (
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#cbd5e1" />
        )}
        <Controls />
        {showMiniMap && <MiniMap nodeStrokeWidth={2} pannable={false} zoomable={false} />}
        {children}
      </ReactFlow>
    </div>
  );
}
