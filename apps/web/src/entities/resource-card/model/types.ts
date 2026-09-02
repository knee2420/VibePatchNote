export interface ResourceCardData extends Record<string, unknown> {
  title: string;
  summary: string;
  type: 'knowledge' | 'rule' | 'asset';
}
