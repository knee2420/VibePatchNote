import { create } from 'zustand';

export type CanvasMode = 'select' | 'hand';

interface CanvasModeState {
  mode: CanvasMode;
  isSearchOpen: boolean;
  setMode: (mode: CanvasMode) => void;
  toggleMode: () => void;
  setIsSearchOpen: (open: boolean) => void;
}

export const useCanvasMode = create<CanvasModeState>((set, get) => ({
  mode: 'select',
  isSearchOpen: false,
  setMode: (mode) => set({ mode }),
  toggleMode: () => set({ mode: get().mode === 'select' ? 'hand' : 'select' }),
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
}));
