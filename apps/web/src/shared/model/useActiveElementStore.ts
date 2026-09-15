/**
 * @fileoverview Global store for tracking the currently selected element or component
 * on the canvas, enabling WinForm / Webflow style contextual property inspection.
 */

import { create } from 'zustand';

export interface SelectedElementData {
  id: string;
  label: string;
  type: string;
  page?: number;
  box_2d?: [number, number, number, number];
  content_summary?: string;
  outline_id?: string;
  purpose?: string;
  slotNumber?: number;
  slotId?: string;
  segmentType?: string;
  sourceFile?: string;
  difficulty?: string;
  slotsCount?: number;
  totalPages?: number;
  structured_data?: Record<string, unknown>;
}


export interface ActiveSelection {
  /** 선택된 캔버스 노드 ID */
  nodeId: string;
  /** 노드 타입 ('referenceDocument' | 'scaffoldDocument' 등) */
  nodeType: string;
  /** 문서 ID */
  docId?: string;
  /** 문서 제목 (fileName 또는 title) */
  docTitle?: string;
  /** 와이어프레임 ID */
  scaffoldId?: string;

  /** 노드 내부에서 선택된 상세 컴포넌트/엘리먼트 (WinForm style element) */
  selectedElement?: SelectedElementData | null;
}

interface ActiveElementState {
  selection: ActiveSelection | null;
  setSelection: (selection: ActiveSelection | null) => void;
  selectElement: (element: SelectedElementData | null) => void;
  clearSelection: () => void;
}

export const useActiveElementStore = create<ActiveElementState>((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
  selectElement: (element) =>
    set((state) => ({
      selection: state.selection
        ? {
            ...state.selection,
            selectedElement: element,
          }
        : null,
    })),
  clearSelection: () => set({ selection: null }),
}));
