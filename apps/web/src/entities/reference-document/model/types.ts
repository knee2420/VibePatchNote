import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const REFERENCE_DOCUMENT_NODE_TYPE = 'referenceDocument';

export interface DocumentSegmentItem {
  id: string;
  page: number;
  type: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  content_summary?: string;
}

export interface ScanDocumentResponse {
  status: string;
  document_title: string;
  total_segments: number;
  segments: DocumentSegmentItem[];
}

export interface ReferenceDocumentData extends Record<string, unknown> {
  title: string;
  url: string;
  fileType?: string; // 'pdf' | 'text' | 'image' | 'default' 등
  size?: number;
  theme?: NodeTheme;
  segments?: DocumentSegmentItem[];
}

