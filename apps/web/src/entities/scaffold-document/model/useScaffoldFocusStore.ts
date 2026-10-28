import { create } from 'zustand';

interface ScaffoldFocusState {
  focusedNodeId: string | null;
  openFocus: (nodeId: string) => void;
  closeFocus: () => void;
}

/** 스캐폴드 문서의 포커스 상태를 소유하는 도메인 스토어. */
export const useScaffoldFocusStore = create<ScaffoldFocusState>((set) => ({
  focusedNodeId: null,
  openFocus: (nodeId: string) => set({ focusedNodeId: nodeId }),
  closeFocus: () => set({ focusedNodeId: null }),
}));
