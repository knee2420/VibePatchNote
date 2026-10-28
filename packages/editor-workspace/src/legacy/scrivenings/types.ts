import type { ReactNode } from 'react';

/** 스크리브닝스 복합 뷰 단위 청크 데이터 */
export interface ScriveningsChunk {
  id: string;
  title: string;
  content: string;
  readOnly?: boolean;
  order?: number;
}

/** 스크리브닝스 뷰 Props */
export interface ScriveningsViewProps {
  chunks: ScriveningsChunk[];
  activeChunkId?: string | null;
  onChunkFocus?: (id: string) => void;
  onChangeChunk?: (id: string, newContent: string) => void;
  renderChunkContent?: (chunk: ScriveningsChunk) => ReactNode;
  emptyText?: string;
  className?: string;
}
