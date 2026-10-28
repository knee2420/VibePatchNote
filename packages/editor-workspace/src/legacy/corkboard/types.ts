import type { ReactNode } from 'react';

/** 코르크보드 인덱스 카드 모델 */
export interface CorkboardCard<T = Record<string, unknown>> {
  id: string;
  title: string;
  synopsis?: string;
  status?: string;
  labelColor?: string;
  badge?: string;
  data?: T;
}

/** 코르크보드 뷰 Props */
export interface CorkboardViewProps<T = Record<string, unknown>> {
  cards: CorkboardCard<T>[];
  selectedId?: string | null;
  onSelect?: (card: CorkboardCard<T>) => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onCardChange?: (card: CorkboardCard<T>) => void;
  renderCardFooter?: (card: CorkboardCard<T>) => ReactNode;
  columns?: number;
  emptyText?: string;
  className?: string;
}
