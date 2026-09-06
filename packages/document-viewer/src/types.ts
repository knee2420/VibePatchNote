import type { ComponentType } from 'react';

export interface ViewerSegment {
  id: string;
  page: number;
  type: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  content_summary?: string;
}

/**
 * 페이지 위에 겹쳐 보여줄 강조 영역.
 *
 * `box_2d` 는 **해당 페이지 기준** 0~1000 정규화 좌표이므로, 반드시 페이지 요소
 * 안에서 렌더해야 한다. 뷰어 컨테이너(패딩·페이지 간격·스크롤 포함)를 기준으로
 * 그리면 어긋난다.
 */
export interface ViewerHighlight {
  id: string;
  page: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  label?: string;
  number?: number;
}

export interface DocumentViewerProps {
  url: string;
  title: string;
  isSpread?: boolean;
  segments?: ViewerSegment[];
  /** 원본 위에 표시할 동기화 강조 영역 (없으면 표시하지 않음). */
  highlight?: ViewerHighlight | null;
  isEditMode?: boolean;
  enableSmartSnap?: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onPageCountChange?: (count: number) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number; aspectRatio: number }) => void;
}

export interface ViewerDefinition {
  id: string;
  canSpread: boolean; // 가로 펼치기(Spread) 지원 여부
  component: ComponentType<DocumentViewerProps>;
}

