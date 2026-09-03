import { useState, type ReactNode } from 'react';
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

const DEFAULT_SNAP_GRID: [number, number] = [20, 20];
const DEFAULT_EDGE_OPTIONS = { type: 'smoothstep', animated: false };

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
      className={`w-full h-full min-h-[600px] bg-slate-50 relative canvas-mode-${canvasMode} ${isSelecting ? 'is-selecting' : ''} ${className}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <style>{`
        /* GPU Hardware Acceleration for 60fps Viewport Panning */
        .react-flow__viewport {
          will-change: transform;
          transform: translateZ(0);
        }

        /* Prevent iframes from stealing mouse events during panning / dragging */
        .canvas-mode-hand iframe,
        .react-flow__pane:active ~ .react-flow__viewport iframe {
          pointer-events: none !important;
        }

        /* Hand (Pan) Mode */
        .canvas-mode-hand .react-flow__pane {
          cursor: grab !important;
        }
        .canvas-mode-hand .react-flow__pane:active,
        .canvas-mode-hand .react-flow__pane.dragging {
          cursor: grabbing !important;
        }

        /* Select Mode: 평소에는 일반 마우스 커서 (기본 화살표) */
        .canvas-mode-select .react-flow__pane,
        .canvas-mode-select .react-flow__pane.selection {
          cursor: default !important;
        }

        /* 마우스를 누르고 있거나(:active) 실제로 네모박스를 그리는 중일 때만 crosshair */
        .canvas-mode-select .react-flow__pane:active,
        .canvas-mode-select.is-selecting .react-flow__pane,
        .canvas-mode-select.is-selecting .react-flow__pane.selection,
        .react-flow__selection {
          cursor: crosshair !important;
        }
      `}</style>
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
        deleteKeyCode={null}
        selectionKeyCode={null}
        fitView
      >
        {showDots && <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#cbd5e1" />}
        <Controls />
        {showMiniMap && <MiniMap />}
        {children}
      </ReactFlow>
    </div>
  );
}
