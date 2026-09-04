export type DocumentTarget = 'atticus-invoice' | 'meeting-minutes' | 'brochure-2408';

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
}
