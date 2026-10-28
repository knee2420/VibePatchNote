/**
 * @file path.ts
 * @description 조상 경로(Breadcrumb) 탐색 조회 (Query)
 */

import type { NodeId, OutlineNode } from '../model/types';

/** 특정 노드까지의 조상 경로(Breadcrumb) 탐색 */
export function getPath(nodes: OutlineNode[], targetId: NodeId): OutlineNode[] {
  function dfs(currNodes: OutlineNode[], path: OutlineNode[]): OutlineNode[] | null {
    for (const node of currNodes) {
      const nextPath = [...path, node];
      if (node.id === targetId) return nextPath;
      const found = dfs(node.children, nextPath);
      if (found) return found;
    }
    return null;
  }

  return dfs(nodes, []) || [];
}
