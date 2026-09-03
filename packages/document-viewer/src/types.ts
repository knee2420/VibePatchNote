import type { ComponentType } from 'react';

export interface ViewerSegment {
  id: string;
  page: number;
  type: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  content_summary?: string;
}

export interface DocumentViewerProps {
  url: string;
  title: string;
  isSpread?: boolean;
  segments?: ViewerSegment[];
  onPageCountChange?: (count: number) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number; aspectRatio: number }) => void;
}

export interface ViewerDefinition {
  id: string;
  canSpread: boolean; // 가로 펼치기(Spread) 지원 여부
  component: ComponentType<DocumentViewerProps>;
}

