/**
 * @file types.ts
 * @description 렌더러와 소비자를 위한 뷰 프로젝션(Projection) 규격
 */

import type { FlattenedNode, NodeId, OutlineNode } from '../model/types';

export type { FlattenedNode };

/** 불릿/리스트 뷰 필터 및 프로젝션 옵션 */
export interface ListFilterOptions {
  /** 완료된 항목 숨기기 */
  hideCompleted?: boolean;
}

/** 칸반 보드 뷰의 단일 컬럼 */
export interface BoardColumn {
  id: NodeId;
  title: string;
  columnNode: OutlineNode;
  /** 해당 컬럼 아래에 속한 2단계 카드 노드 목록 */
  cards: OutlineNode[];
}

/** 칸반 보드 뷰 렌더러에 공급하는 최상위 뷰모델 */
export interface BoardViewModel {
  /** 현재 줌인된 컨텍스트 노드 (null이면 전체 루트) */
  contextNode: OutlineNode | null;
  /** 컬럼 목록 */
  columns: BoardColumn[];
}

/** 보드 뷰 필터 및 프로젝션 옵션 */
export interface BoardFilterOptions {
  /** 완료된 카드 숨기기 */
  hideCompletedCards?: boolean;
}
