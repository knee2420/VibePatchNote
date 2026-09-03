import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_SESSION_TITLE = 'Untitled Session';

const STORAGE_KEY = 'vibe-workspace-session-storage';
/** 세션 식별자가 캔버스 스토어에 함께 저장되던 구버전 키. */
const LEGACY_STORAGE_KEY = 'vibe-canvas-board-storage';

export interface WorkspaceSessionState {
  activeSessionId: string | null;
  activeSessionTitle: string;
  setActiveSession: (id: string | null, title: string) => void;
  setActiveSessionTitle: (title: string) => void;
  clearActiveSession: () => void;
}

/**
 * 구버전 스냅샷에 남아 있는 활성 세션 정보를 새 저장소 키로 1회 이관합니다.
 * 리팩터링 전에 열어두던 세션이 그대로 이어지도록 하기 위한 보정입니다.
 */
function migrateLegacySessionState(): void {
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw) as {
      state?: { activeSessionId?: unknown; activeSessionTitle?: unknown };
    };

    const legacyId = legacy.state?.activeSessionId;
    const legacyTitle = legacy.state?.activeSessionTitle;
    if (typeof legacyId !== 'string' && typeof legacyTitle !== 'string') return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 0,
        state: {
          activeSessionId: typeof legacyId === 'string' ? legacyId : null,
          activeSessionTitle: typeof legacyTitle === 'string' ? legacyTitle : DEFAULT_SESSION_TITLE,
        },
      })
    );
  } catch {
    // 손상된 레거시 스냅샷은 무시하고 기본값으로 시작합니다.
  }
}

migrateLegacySessionState();

/** 현재 열려 있는 워크스페이스 세션의 식별 정보만 소유하는 스토어. */
export const useWorkspaceSessionStore = create<WorkspaceSessionState>()(
  persist(
    (set) => ({
      activeSessionId: null,
      activeSessionTitle: DEFAULT_SESSION_TITLE,
      setActiveSession: (id, title) => set({ activeSessionId: id, activeSessionTitle: title }),
      setActiveSessionTitle: (title) => set({ activeSessionTitle: title }),
      clearActiveSession: () =>
        set({ activeSessionId: null, activeSessionTitle: DEFAULT_SESSION_TITLE }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        activeSessionTitle: state.activeSessionTitle,
      }),
    }
  )
);
