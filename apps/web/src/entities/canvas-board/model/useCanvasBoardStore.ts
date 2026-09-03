import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'vibe-canvas-board-storage';

export interface CanvasBoardState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void;
  removeNodes: (ids: string[]) => void;
  /** 세션 전환 시 그래프 전체를 교체합니다. */
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  /** 캔버스를 비웁니다. */
  resetGraph: () => void;
}

type PersistedCanvasBoard = Pick<CanvasBoardState, 'nodes' | 'edges'>;

// rAF Batching buffers to eliminate micro-stutters under high-polling mouse movements
let pendingNodeChanges: Parameters<CanvasBoardState['onNodesChange']>[0] = [];
let nodeChangesRafId: number | null = null;

let pendingEdgeChanges: Parameters<CanvasBoardState['onEdgesChange']>[0] = [];
let edgeChangesRafId: number | null = null;

/**
 * 캔버스 그래프(노드/엣지) 단일 소유 스토어.
 *
 * 세션(워크스페이스) 식별자는 이 엔티티의 관심사가 아니므로
 * `entities/workspace-session` 이 별도로 소유합니다.
 */
export const useCanvasBoardStore = create<CanvasBoardState>()(
  persist(
    (set, get) => ({
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
      setGraph: (nodes, edges) => {
        set({ nodes, edges });
      },
      resetGraph: () => {
        set({ nodes: [], edges: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedCanvasBoard => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      // 세션 정보가 함께 저장돼 있던 구버전 스냅샷에서도 그래프만 안전하게 복원합니다.
      merge: (persisted, current) => {
        const snapshot = persisted as Partial<PersistedCanvasBoard> | undefined;
        return {
          ...current,
          nodes: snapshot?.nodes ?? current.nodes,
          edges: snapshot?.edges ?? current.edges,
        };
      },
    }
  )
);

// FSD 경계를 준수하면서 노드 컴포넌트에서 zustand nodes.data를 안전하게 갱신할 수 있는 글로벌 이벤트 브릿지 (R1 해결)
if (typeof window !== 'undefined') {
  window.addEventListener('vibe:update-node-data', (e: Event) => {
    const customEvent = e as CustomEvent<{ id: string; data: Record<string, unknown> }>;
    if (!customEvent.detail?.id) return;
    const { id, data } = customEvent.detail;
    useCanvasBoardStore.getState().setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    );
  });
}

