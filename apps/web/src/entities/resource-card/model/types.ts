import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const RESOURCE_CARD_NODE_TYPE = 'resourceCard';

export interface ResourceCardData extends Record<string, unknown> {
  title: string;
  summary: string;
  type: 'knowledge' | 'rule' | 'asset';
  theme?: NodeTheme;
}
