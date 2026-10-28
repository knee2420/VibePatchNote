/**
 * @file toBoardViewModel.ts
 * @description 트리 데이터를 칸반 보드(Column-Card) 2차원 뷰모델로 변환하는 프로젝션
 *
 * 매핑 규칙:
 * 1. 현재 줌인된 노드(또는 루트)의 1단계 직계 자식 노드들을 '컬럼(Column)'으로 취급합니다.
 * 2. 각 컬럼 노드의 직계 자식 노드들을 해당 컬럼의 '카드(Card)'로 취급합니다.
 */

import type { NodeId, OutlineNode } from '../../model/types';
import { findNode } from '../../queries/find';
import type { BoardColumn, BoardFilterOptions, BoardViewModel } from '../types';

export function toBoardViewModel(
  rootNodes: OutlineNode[],
  zoomedId?: NodeId | null,
  options?: BoardFilterOptions
): BoardViewModel {
  let contextNode: OutlineNode | null = null;
  let columnSourceNodes: OutlineNode[] = rootNodes;

  if (zoomedId) {
    contextNode = findNode(rootNodes, zoomedId);
    if (contextNode) {
      columnSourceNodes = contextNode.children;
    }
  }

  const hideCompletedCards = options?.hideCompletedCards ?? false;

  const columns: BoardColumn[] = columnSourceNodes.map((colNode) => {
    const cards = hideCompletedCards
      ? colNode.children.filter((card) => !card.isCompleted)
      : colNode.children;

    return {
      id: colNode.id,
      title: colNode.text || '제목 없는 컬럼',
      columnNode: colNode,
      cards,
    };
  });

  return {
    contextNode,
    columns,
  };
}
