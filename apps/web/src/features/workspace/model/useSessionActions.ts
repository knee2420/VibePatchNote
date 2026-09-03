import { useCallback } from 'react';
import type { Edge, Node } from '@xyflow/react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import {
  DEFAULT_SESSION_TITLE,
  useWorkspaceSessionStore,
} from '@/entities/workspace-session';

/**
 * 세션 식별 정보와 캔버스 그래프를 함께 전환하는 액션 모음.
 *
 * 두 엔티티 스토어에 걸친 조합이므로 feature 레이어가 소유합니다.
 */
export function useSessionActions() {
  const setGraph = useCanvasBoardStore((s) => s.setGraph);
  const resetGraph = useCanvasBoardStore((s) => s.resetGraph);
  const setActiveSession = useWorkspaceSessionStore((s) => s.setActiveSession);
  const clearActiveSession = useWorkspaceSessionStore((s) => s.clearActiveSession);

  const loadSession = useCallback(
    (id: string | null, title: string, nodes: Node[], edges: Edge[]) => {
      setActiveSession(id, title || DEFAULT_SESSION_TITLE);
      setGraph(nodes, edges);
    },
    [setActiveSession, setGraph]
  );

  /** 활성 세션 연결을 끊고 빈 캔버스로 되돌립니다. */
  const closeSession = useCallback(() => {
    clearActiveSession();
    resetGraph();
  }, [clearActiveSession, resetGraph]);

  return { loadSession, closeSession };
}
