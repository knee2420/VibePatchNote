import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface HybridEditorState {
  activeSessionId: string | null;
  activeSessionTitle: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void;
  removeNodes: (ids: string[]) => void;
  clearSession: () => void;
  loadSession: (id: string | null, title: string, nodes: Node[], edges: Edge[]) => void;
  setActiveSessionTitle: (title: string) => void;
}

export const useHybridEditorState = create<HybridEditorState>()(
  persist(
    (set, get) => ({
    activeSessionId: null,
    activeSessionTitle: 'Untitled Session',
    nodes: [],
    edges: [],
    onNodesChange: (changes) => {
      set({ nodes: applyNodeChanges(changes, get().nodes) });
    },
    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
      set({ edges: addEdge(connection, get().edges) });
    },
    addNode: (node) => {
      set({ nodes: [...get().nodes, node] });
    },
    setNodes: (updater) => {
      const currentNodes = get().nodes;
      const nextNodes = typeof updater === 'function' ? updater(currentNodes) : updater;
      set({ nodes: nextNodes });
    },
    removeNodes: (ids) => {
      const idSet = new Set(ids);
      set({
        nodes: get().nodes.filter((node) => !idSet.has(node.id)),
        edges: get().edges.filter(
          (edge) => !idSet.has(edge.source) && !idSet.has(edge.target)
        ),
      });
    },
    clearSession: () => {
      set({ activeSessionId: null, activeSessionTitle: 'Untitled Session', nodes: [], edges: [] });
    },
    loadSession: (id, title, nodes, edges) => {
      set({ activeSessionId: id, activeSessionTitle: title, nodes, edges });
    },
    setActiveSessionTitle: (title) => {
      set({ activeSessionTitle: title });
    },
  }),
  {
    name: 'hybrid-editor-storage',
  }
)
);
