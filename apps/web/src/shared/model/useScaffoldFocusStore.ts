import { create } from 'zustand';

interface ScaffoldFocusState {
  focusedNodeId: string | null;
  openFocus: (nodeId: string) => void;
  closeFocus: () => void;
}

export const useScaffoldFocusStore = create<ScaffoldFocusState>((set) => ({
  focusedNodeId: null,
  openFocus: (nodeId: string) => set({ focusedNodeId: nodeId }),
  closeFocus: () => set({ focusedNodeId: null }),
}));
