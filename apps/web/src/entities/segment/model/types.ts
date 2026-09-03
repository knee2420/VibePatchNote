import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const SEGMENT_NODE_TYPE = 'segment';

export interface SegmentData extends Record<string, unknown> {
  title: string;
  content: string;
  theme?: NodeTheme;
  isMasking?: boolean; // AI masking flag
}
