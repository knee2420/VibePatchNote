import { useState, useEffect, type ReactNode } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useReactFlow,
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

/**
 * [Ctrl + 마우스 휠 최우선 뷰포트 줌 컨트롤러]
 * 마우스가 문서 카드, 텍스트 에디터, PDF 뷰어 등 하위 컴포넌트(nowheel, stopPropagation) 위에 있어도
 * DOM 캡처링(capture: true) 단계에서 Ctrl/Cmd + 휠 이벤트를 최우선 가로채어 뷰포트 줌을 실행하고,
 * 브라우저 전체 창 줌(110%, 125% 등)을 원천 차단합니다.
 * Ctrl 키가 없을 때의 일반 휠은 기존 카드 내부 스크롤 및 캔버스 패닝에 온전히 전달됩니다.
 */
function CtrlWheelZoomController() {
  const { zoomTo, getZoom } = useReactFlow();

  useEffect(() => {
    const rfElement = document.querySelector('.react-flow') as HTMLElement | null;
    if (!rfElement) return;

    const handleWheelCapture = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // 1. 브라우저 전체 창 확대/축소 방지 및 이벤트 선점
        e.preventDefault();
        e.stopPropagation();

        // 2. React Flow 뷰포트 줌인 / 줌아웃 (deltaY < 0: 줌인, deltaY > 0: 줌아웃)
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
        const currentZoom = getZoom();
        const nextZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 4);
        zoomTo(nextZoom, { duration: 60 });
      }
    };

    // capture: true로 자식 노드의 nowheel이나 stopPropagation보다 먼저 최우선 캡처
    rfElement.addEventListener('wheel', handleWheelCapture, { passive: false, capture: true });
    return () => {
      rfElement.removeEventListener('wheel', handleWheelCapture, { capture: true });
    };
  }, [getZoom, zoomTo]);

  return null;
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
        <CtrlWheelZoomController />
        {showDots && <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#cbd5e1" />}
        <Controls />
        {showMiniMap && <MiniMap />}
        {children}
      </ReactFlow>
    </div>
  );
}
