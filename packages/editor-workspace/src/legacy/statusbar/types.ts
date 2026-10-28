import type { ReactNode } from 'react';

/** 브레드크럼 항목 모델 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

/** 브레드크럼 컴포넌트 Props */
export interface BreadcrumbBarProps {
  items: BreadcrumbItem[];
  onSelect?: (item: BreadcrumbItem) => void;
  className?: string;
}
