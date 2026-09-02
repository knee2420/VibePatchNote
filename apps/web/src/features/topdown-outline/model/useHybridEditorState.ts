import { useState, useCallback } from 'react';
import { 
  type Node, 
  type Edge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  type OnNodesChange, 
  type OnEdgesChange,
  addEdge,
  type Connection
} from '@xyflow/react';

// Initial mock data for the Top-Down Outline
const initialNodes: Node[] = [
  {
    id: 'chapter-1',
    type: 'segment',
    position: { x: 250, y: 100 },
    data: { 
      title: '제 1장. 서론 (Introduction)', 
      content: '<p>이곳에 작품의 도입부를 작성합니다. <strong>AI 마스킹</strong>을 통해 특정 문장만 수정할 수도 있습니다.</p>' 
    },
  },
  {
    id: 'chapter-2',
    type: 'segment',
    position: { x: 250, y: 400 },
    data: { 
      title: '제 2장. 본론 (Body)', 
      content: '<p>핵심 사건이 전개되는 구간입니다.</p>' 
    },
  },
  // Mock Post-it Resource Card
  {
    id: 'resource-1',
    type: 'resourceCard',
    position: { x: 800, y: 150 },
    data: {
      title: '세계관 설정 #1',
      summary: '주인공이 속한 제국의 멸망 배경. 300년 전 대마법사의 폭주로 인해 북부 영지가 초토화됨.',
      type: 'knowledge'
    }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'chapter-1', target: 'chapter-2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e-res-1', source: 'resource-1', sourceHandle: 'left', target: 'chapter-1', targetHandle: 'right-attach', animated: true, style: { stroke: '#f59e0b', strokeDasharray: '5,5' } }
];

export function useHybridEditorState() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect
  };
}
