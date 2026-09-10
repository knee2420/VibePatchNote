import { useCallback, useEffect, useState } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import type { WorkspaceSession } from '@/entities/workspace-session';
import { useWorkspaceSessionStore } from '@/entities/workspace-session';
import { pickPersistedNodeData } from '@/shared/lib';

import { workspaceApi } from '../api/workspaceApi';
import { useSessionActions } from './useSessionActions';

interface UseWorkspaceSessionsOptions {
  /** 시트가 열려 있을 때만 목록을 갱신합니다. */
  enabled: boolean;
}

/**
 * 워크스페이스 세션 목록 화면의 헤드리스 로직.
 * 확인창/입력창 같은 사용자 상호작용은 호출하는 UI가 담당합니다.
 */
export function useWorkspaceSessions({ enabled }: UseWorkspaceSessionsOptions) {
  const [sessions, setSessions] = useState<WorkspaceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeSessionId = useWorkspaceSessionStore((s) => s.activeSessionId);
  const activeSessionTitle = useWorkspaceSessionStore((s) => s.activeSessionTitle);
  const setActiveSessionTitle = useWorkspaceSessionStore((s) => s.setActiveSessionTitle);
  const { loadSession, closeSession } = useSessionActions();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setSessions(await workspaceApi.list());
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  const createSession = useCallback(
    async (title: string) => {
      try {
        const created = await workspaceApi.create({ title, description: '' });
        setSessions((prev) => [...prev, created]);
        loadSession(created.id, created.title, created.nodes ?? [], created.edges ?? []);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },
    [loadSession]
  );

  /** 현재 캔버스 상태를 활성 세션에 저장합니다. 활성 세션이 없으면 false 를 돌려줍니다. */
  const saveActiveSession = useCallback(async () => {
    if (!activeSessionId) return false;

    const { nodes, edges } = useCanvasBoardStore.getState();
    try {
      await workspaceApi.update(activeSessionId, {
        title: activeSessionTitle,
        nodes: pickPersistedNodeData(nodes),
        edges,
      });
      await refresh();
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }, [activeSessionId, activeSessionTitle, refresh]);

  const renameSession = useCallback(
    async (session: WorkspaceSession, nextTitle: string) => {
      try {
        await workspaceApi.update(session.id, {
          title: nextTitle,
          nodes: session.nodes,
          edges: session.edges,
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, title: nextTitle } : s))
        );
        if (activeSessionId === session.id) {
          setActiveSessionTitle(nextTitle);
        }
      } catch (error) {
        console.error('Failed to update session title:', error);
      }
    },
    [activeSessionId, setActiveSessionTitle]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await workspaceApi.remove(id);
        await refresh();
        if (activeSessionId === id) {
          closeSession();
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [activeSessionId, closeSession, refresh]
  );

  const openSession = useCallback(
    (session: WorkspaceSession) => {
      loadSession(session.id, session.title, session.nodes ?? [], session.edges ?? []);
    },
    [loadSession]
  );

  return {
    sessions,
    isLoading,
    activeSessionId,
    refresh,
    createSession,
    saveActiveSession,
    renameSession,
    deleteSession,
    openSession,
  };
}
