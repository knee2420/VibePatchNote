import type { ReactNode } from 'react';

/** 아웃라이너 행 데이터 모델 */
export interface OutlinerRow<T = Record<string, unknown>> {
  id: string;
  number?: number;
  title: string;
  synopsis?: string;
  wordCount?: number;
  status?: string;
  label?: string;
  updatedAt?: string | number;
  data?: T;
}

/** 아웃라이너 컬럼 정의 */
export interface OutlinerColumn<T = Record<string, unknown>> {
  key: keyof OutlinerRow<T> | string;
  header: string;
  width?: number | string;
  render?: (row: OutlinerRow<T>) => ReactNode;
}

/** 아웃라이너 컴포넌트 Props */
export interface OutlinerProps<T = Record<string, unknown>> {
  rows: OutlinerRow<T>[];
  selectedId?: string | null;
  onSelect?: (row: OutlinerRow<T>) => void;
  onChangeRow?: (updated: OutlinerRow<T>) => void;
  statusOptions?: string[];
  emptyText?: string;
  className?: string;
}
