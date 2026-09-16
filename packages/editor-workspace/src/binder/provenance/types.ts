/** 원천 출처 정보 모델 */
export interface ProvenanceItem {
  id: string;
  sourceDocTitle?: string;
  page?: number;
  box_2d?: [number, number, number, number];
  label?: string;
  confidence?: number;
}

/** 소화율 원형 링 컴포넌트 Props */
export interface CoverageRingProps {
  /** 0~100 퍼센트 수치 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

/** 출처 칩 목록 Props */
export interface ProvenanceChipListProps {
  items: ProvenanceItem[];
  onSelect?: (item: ProvenanceItem) => void;
  maxVisible?: number;
  className?: string;
}
