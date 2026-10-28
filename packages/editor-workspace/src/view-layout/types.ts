import type { ReactNode } from 'react';

/** 문서를 보는 4대 뷰 형태 레이아웃 모드 */
export type PageLayoutMode = 'continuous' | 'paged' | 'spread' | 'zen';

/** 페이지네이션 및 뷰 상태 */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  layoutMode: PageLayoutMode;
}

/** 페이지네이션 바 Props */
export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  zoom?: number;
  layoutMode?: PageLayoutMode;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onLayoutModeChange?: (mode: PageLayoutMode) => void;
  showZoom?: boolean;
  showLayoutModes?: boolean;
  className?: string;
}

/** 페이지네이션 레이아웃 컨테이너 Props */
export interface PagedCanvasContainerProps {
  layoutMode: PageLayoutMode;
  zoom?: number;
  currentPage?: number;
  totalPages?: number;
  children: ReactNode;
  className?: string;
}
