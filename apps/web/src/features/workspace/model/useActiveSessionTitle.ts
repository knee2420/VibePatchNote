import { useCallback } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { useWorkspaceSessionStore } from '@/entities/workspace-session';

import { workspaceApi } from '../api/workspaceApi';

/**
 * 활성 세션의 제목을 변경하고 백엔드에 즉시 반영합니다.
 * 활성 세션이 없으면 로컬 상태만 갱신합니다.
 */
export function useActiveSessionTitle() {
  const activeSessionId = useWorkspaceSessionStore((s) => s.activeSessionId);
  const activeSessionTitle = useWorkspaceSessionStore((s) => s.activeSessionTitle);
  const setActiveSessionTitle = useWorkspaceSessionStore((s) => s.setActiveSessionTitle);

  const renameActiveSession = useCallback(
    async (nextTitle: string) => {
      const trimmed = nextTitle.trim();
      if (!trimmed) return;

      setActiveSessionTitle(trimmed);
      if (!activeSessionId) return;

      const { nodes, edges } = useCanvasBoardStore.getState();
      try {
        await workspaceApi.update(activeSessionId, { title: trimmed, nodes, edges });
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    },
    [activeSessionId, setActiveSessionTitle]
  );

  return { activeSessionId, activeSessionTitle, renameActiveSession };
}
