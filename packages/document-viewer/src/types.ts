import type { ComponentType } from 'react';

export interface DocumentViewerProps {
  url: string;
  title: string;
  isSpread?: boolean;
  onPageCountChange?: (count: number) => void;
}

export interface ViewerDefinition {
  id: string;
  canSpread: boolean; // 가로 펼치기(Spread) 지원 여부
  component: ComponentType<DocumentViewerProps>;
}
