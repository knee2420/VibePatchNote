/**
 * @file locate.ts
 * @description 노드의 부모·형제 배열 위치 탐색 (패키지 내부 전용)
 *
 * 반환하는 `siblings` 는 트리 안의 실제 배열이다. 이것을 밖으로 내주면
 * transforms 를 거치지 않고 트리를 바꿀 수 있게 되므로 Public API 로 내보내지 않는다.
 */

import type { NodeId, OutlineNode } from '../model/types';

export interface ParentLookupResult {
  parent: OutlineNode | null; // null이면 루트 레벨
  index: number;
  siblings: OutlineNode[];
}

/** 특정 노드의 부모, 형제 목록, 인덱스를 탐색 */
export function findParentAndSiblings(
  nodes: OutlineNode[],
  targetId: NodeId,
  parent: OutlineNode | null = null
): ParentLookupResult | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) {
      return { parent, index: i, siblings: nodes };
    }
    const found = findParentAndSiblings(nodes[i].children, targetId, nodes[i]);
    if (found) return found;
  }
  return null;
}
