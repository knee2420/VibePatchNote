export type DocumentTarget = 'atticus-invoice' | 'meeting-minutes' | 'brochure-2408';

export interface SlotMappingItem {
  id: string;
  number: number;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0~1000)
  pageNumber?: number;
}

export interface ScaffoldMeta {
  id: string;
  title: string;
  targetDoc: DocumentTarget;
  sourcePdfFileName: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScaffoldExtractResult {
  meta: ScaffoldMeta;
  htmlContent: string;
  markdownContent: string;
  slots?: SlotMappingItem[];
}

