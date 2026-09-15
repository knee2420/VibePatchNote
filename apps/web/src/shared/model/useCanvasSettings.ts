import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CanvasSettingsState {
  snapToGrid: boolean;
  snapGrid: [number, number];
  showDots: boolean;
  showMiniMap: boolean;
  isReadOnly: boolean;
  enableSmartSnap: boolean;
  showRecipeInspector: boolean;
  toggleSnapToGrid: () => void;
  toggleShowDots: () => void;
  toggleShowMiniMap: () => void;
  toggleReadOnly: () => void;
  toggleEnableSmartSnap: () => void;
  toggleShowRecipeInspector: () => void;
  setShowRecipeInspector: (visible: boolean) => void;
  setSnapGrid: (grid: [number, number]) => void;
}

export const useCanvasSettings = create<CanvasSettingsState>()(
  persist(
    (set, get) => ({
      snapToGrid: true,
      snapGrid: [20, 20],
      showDots: true,
      showMiniMap: true,
      isReadOnly: false,
      enableSmartSnap: true,
      showRecipeInspector: false,

      toggleSnapToGrid: () => set({ snapToGrid: !get().snapToGrid }),
      toggleShowDots: () => set({ showDots: !get().showDots }),
      toggleShowMiniMap: () => set({ showMiniMap: !get().showMiniMap }),
      toggleReadOnly: () => set({ isReadOnly: !get().isReadOnly }),
      toggleEnableSmartSnap: () => set({ enableSmartSnap: !get().enableSmartSnap }),
      toggleShowRecipeInspector: () => set({ showRecipeInspector: !get().showRecipeInspector }),
      setShowRecipeInspector: (visible) => set({ showRecipeInspector: visible }),
      setSnapGrid: (grid) => set({ snapGrid: grid }),
    }),
    {
      name: 'vibe-canvas-settings',
    }
  )
);
