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
import { persist, createJSONStorage } from 'zustand/middleware';
import { pickPersistedNodeData } from '@/shared/lib';

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

// 노드 드래그/이동 시 발생하는 고주파 setItem I/O 블로킹을 해소하기 위한 디바운스 스토리지
const debouncedLocalStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingName = '';
    let pendingValue = '';

    const flush = () => {
      if (pendingName) {
        try {
          localStorage.setItem(pendingName, pendingValue);
        } catch (e) {
          console.error('Failed to write to localStorage:', e);
        }
        pendingName = '';
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', flush);
    }

    return (name: string, value: string) => {
      pendingName = name;
      pendingValue = value;
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, 400);
    };
  })(),
  removeItem: (name: string) => localStorage.removeItem(name),
};

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
      storage: createJSONStorage(() => debouncedLocalStorage),
      // 다른 애그리거트의 정본은 백엔드가 갖는다. 로컬 스냅샷에는 포인터만 남긴다.
      partialize: (state): PersistedCanvasBoard => ({
        nodes: pickPersistedNodeData(state.nodes),
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
