import { useEffect, useState } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { useWorkspaceSessionStore } from '@/entities/workspace-session';
import { stripArchivedNodeBody } from '@/shared/lib';

import { workspaceApi } from '../api/workspaceApi';
import { useSessionActions } from './useSessionActions';

const AUTO_SAVE_DEBOUNCE_MS = 2000;

/**
 * 활성 세션을 백엔드와 동기화합니다.
 *
 * 1. 마운트/세션 전환 시 서버 스냅샷으로 캔버스를 복원
 * 2. 복원 완료 이후의 변경분을 디바운스 자동 저장
 */
export function useSessionSync() {
  const [isRestored, setIsRestored] = useState(false);

  const nodes = useCanvasBoardStore((s) => s.nodes);
  const edges = useCanvasBoardStore((s) => s.edges);
  const activeSessionId = useWorkspaceSessionStore((s) => s.activeSessionId);
  const activeSessionTitle = useWorkspaceSessionStore((s) => s.activeSessionTitle);

  const { loadSession } = useSessionActions();

  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      if (!activeSessionId) {
        setIsRestored(true);
        return;
      }

      try {
        const session = await workspaceApi.get(activeSessionId);
        if (!isCancelled && session.nodes?.length) {
          loadSession(session.id, session.title, session.nodes, session.edges ?? []);
        }
      } catch (error) {
        console.error('Failed to restore session from backend:', error);
      } finally {
        if (!isCancelled) setIsRestored(true);
      }
    }

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [activeSessionId, loadSession]);

  useEffect(() => {
    if (!isRestored || !activeSessionId) return;

    const timeoutId = setTimeout(() => {
      workspaceApi
        .update(activeSessionId, {
          title: activeSessionTitle,
          nodes: stripArchivedNodeBody(nodes),
          edges,
        })
        .catch((error: unknown) => {
          console.error('Auto-save failed:', error);
        });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, activeSessionId, activeSessionTitle, isRestored]);

  return { isRestored };
}
