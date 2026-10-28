/**
 * @file find.ts
 * @description 트리 노드 탐색 및 인접 관계 조회 (Query)
 */

import { findParentAndSiblings } from '../internal/locate';
import type { FlattenedNode, NodeId, OutlineNode } from '../model/types';

/** 트리 전체에서 특정 ID의 노드를 재귀 탐색 */
export function findNode(nodes: OutlineNode[], targetId: NodeId): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    const found = findNode(node.children, targetId);
    if (found) return found;
  }
  return null;
}

/** 이전 형제 및 다음 형제 탐색 */
export function getSiblings(
  nodes: OutlineNode[],
  targetId: NodeId
): { prev: OutlineNode | null; next: OutlineNode | null } {
  const result = findParentAndSiblings(nodes, targetId);
  if (!result) return { prev: null, next: null };

  const { siblings, index } = result;
  return {
    prev: index > 0 ? siblings[index - 1] : null,
    next: index < siblings.length - 1 ? siblings[index + 1] : null,
  };
}

/** 위/아래 방향키 이동 시 다음 타깃 노드 ID 계산 */
export function getNextFocusId(
  flattened: FlattenedNode[],
  currentId: NodeId,
  direction: 'up' | 'down'
): NodeId | null {
  const currentIndex = flattened.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) return null;

  if (direction === 'up') {
    return currentIndex > 0 ? flattened[currentIndex - 1].id : null;
  } else {
    return currentIndex < flattened.length - 1
      ? flattened[currentIndex + 1].id
      : null;
  }
}

/**
 * 마우스 드래그 또는 Shift+클릭 시 두 노드 사이의 가시(Visible) 노드 ID 범위 추출
 */
export function getRangeBetween(
  flattened: FlattenedNode[],
  startId: NodeId,
  endId: NodeId
): NodeId[] {
  const startIndex = flattened.findIndex((item) => item.id === startId);
  const endIndex = flattened.findIndex((item) => item.id === endId);

  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);

  return flattened.slice(from, to + 1).map((item) => item.id);
}
