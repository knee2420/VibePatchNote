/** 서식 슬롯 하나와 원본 문서에서의 실측 위치. */
export interface SlotMappingItem {
  id: string;
  number: number;
  label: string;
  /** [ymin, xmin, ymax, xmax] — 해당 페이지 기준 0~1000 정규화. */
  box_2d: [number, number, number, number];
  /** 이 좌표가 속한 원본 페이지 번호(1-based). */
  pageNumber?: number;
}

export interface ScaffoldMeta {
  id: string;
  title: string;
  /** 원본 문서 유형. 엔진이 문서마다 산출하므로 열거형으로 고정하지 않는다. */
  targetDoc: string;
  sourcePdfFileName: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScaffoldExtractResult {
  meta: ScaffoldMeta;
  htmlContent: string;
  markdownContent: string;
  slots?: SlotMappingItem[];
}
