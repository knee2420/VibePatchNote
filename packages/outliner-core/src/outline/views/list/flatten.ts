/**
 * @file flatten.ts
 * @description 가상화 및 선형 불릿 뷰용 평탄화(Flatten) 프로젝션
 */

import type { FlattenedNode, NodeId, OutlineNode } from '../../model/types';
import { findNode } from '../../queries/find';
import { getPath } from '../../queries/path';
import type { ListFilterOptions } from '../types';

/**
 * 트리를 1차원 평탄화(Flatten) 배열로 변환하여 불릿 렌더러에 공급
 * - 줌인된 노드가 있으면 해당 노드의 children만 전개
 * - hideCompleted 옵션 시 완료된 노드 및 그 하위 필터링 지원
 */
export function flattenTree(
  rootNodes: OutlineNode[],
  zoomedId?: NodeId | null,
  options?: ListFilterOptions
): FlattenedNode[] {
  let displayNodes = rootNodes;
  let basePath: NodeId[] = [];

  if (zoomedId) {
    const target = findNode(rootNodes, zoomedId);
    if (target) {
      displayNodes = target.children;
      basePath = getPath(rootNodes, zoomedId).map((n) => n.id);
    }
  }

  const result: FlattenedNode[] = [];
  const hideCompleted = options?.hideCompleted ?? false;

  function traverse(
    nodes: OutlineNode[],
    depth: number,
    parentId: NodeId | null,
    currentPath: NodeId[]
  ) {
    for (const node of nodes) {
      if (hideCompleted && node.isCompleted) {
        continue;
      }

      const nodePath = [...currentPath, node.id];
      const hasChildren = node.children.length > 0;
      const isFolded = !!node.isFolded;

      result.push({
        id: node.id,
        node,
        depth,
        parentId,
        hasChildren,
        isFolded,
        path: nodePath,
      });

      // 접혀있지 않은 자식 노드만 전개
      if (hasChildren && !isFolded) {
        traverse(node.children, depth + 1, node.id, nodePath);
      }
    }
  }

  traverse(displayNodes, 0, zoomedId || null, basePath);
  return result;
}
