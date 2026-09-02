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

// Start with a clean slate
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

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
