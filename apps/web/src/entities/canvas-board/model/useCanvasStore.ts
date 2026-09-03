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

export interface CanvasBoardState {
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

// rAF Batching buffers to eliminate micro-stutters under high-polling mouse movements
let pendingNodeChanges: Parameters<CanvasBoardState['onNodesChange']>[0] = [];
let nodeChangesRafId: number | null = null;

let pendingEdgeChanges: Parameters<CanvasBoardState['onEdgesChange']>[0] = [];
let edgeChangesRafId: number | null = null;

export const useCanvasStore = create<CanvasBoardState>()(
  persist(
    (set, get) => ({
      activeSessionId: null,
      activeSessionTitle: 'Untitled Session',
      nodes: [],
      edges: [],
      onNodesChange: (changes) => {
        pendingNodeChanges.push(...changes);
        if (nodeChangesRafId === null) {
          nodeChangesRafId = requestAnimationFrame(() => {
            const currentChanges = pendingNodeChanges;
            pendingNodeChanges = [];
            nodeChangesRafId = null;
            set({ nodes: applyNodeChanges(currentChanges, get().nodes) });
          });
        }
      },
      onEdgesChange: (changes) => {
        pendingEdgeChanges.push(...changes);
        if (edgeChangesRafId === null) {
          edgeChangesRafId = requestAnimationFrame(() => {
            const currentChanges = pendingEdgeChanges;
            pendingEdgeChanges = [];
            edgeChangesRafId = null;
            set({ edges: applyEdgeChanges(currentChanges, get().edges) });
          });
        }
      },
      onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
      },
      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
      },
      setNodes: (updater) => {
        const nextNodes = typeof updater === 'function' ? updater(get().nodes) : updater;
        set({ nodes: nextNodes });
      },
      removeNodes: (ids) => {
        const targetSet = new Set(ids);
        set({
          nodes: get().nodes.filter((n) => !targetSet.has(n.id)),
          edges: get().edges.filter((e) => !targetSet.has(e.source) && !targetSet.has(e.target)),
        });
      },
      clearSession: () => {
        set({
          activeSessionId: null,
          activeSessionTitle: 'Untitled Session',
          nodes: [],
          edges: [],
        });
      },
      loadSession: (id, title, nodes, edges) => {
        set({
          activeSessionId: id,
          activeSessionTitle: title,
          nodes,
          edges,
        });
      },
      setActiveSessionTitle: (title) => {
        set({ activeSessionTitle: title });
      },
    }),
    {
      name: 'vibe-canvas-board-storage',
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        activeSessionTitle: state.activeSessionTitle,
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
