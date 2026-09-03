import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const REFERENCE_DOCUMENT_NODE_TYPE = 'referenceDocument';

export interface ReferenceDocumentData extends Record<string, unknown> {
  title: string;
  url: string;
  fileType?: string; // 'pdf' | 'text' | 'image' | 'default' 등
  size?: number;
  theme?: NodeTheme;
}
