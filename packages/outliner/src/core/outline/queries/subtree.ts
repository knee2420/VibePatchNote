/**
 * @file subtree.ts
 * @description 중첩 트리에서 고른 불릿들과 그 하위에 대한 조회 (Query)
 */

import type { NodeId, OutlineNode } from '../model/types';

/**
 * 고른 노드들 중 "맨 위" 노드만 문서 순서대로 남긴다.
 * (부모와 자식을 함께 골랐다면 부모만 다루면 자식은 따라온다)
 */
export function getTopmostNodeIds(rootNodes: OutlineNode[], ids: NodeId[]): NodeId[] {
  const wanted = new Set(ids);
  const result: NodeId[] = [];

  function traverse(nodes: OutlineNode[]) {
    for (const node of nodes) {
      if (wanted.has(node.id)) {
        result.push(node.id);
      } else if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(rootNodes);
  return result;
}

/** 노드와 그 하위에 접힌 곳이 하나도 없는지 (전부 펼쳐진 상태인지) */
export function isFullyExpanded(node: OutlineNode): boolean {
  if (node.children.length === 0) return true;
  return !node.isFolded && node.children.every(isFullyExpanded);
}
