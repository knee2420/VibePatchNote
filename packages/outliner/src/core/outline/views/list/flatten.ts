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
  let baseAncestorCompleted = false;

  if (zoomedId) {
    const target = findNode(rootNodes, zoomedId);
    if (target) {
      displayNodes = target.children;
      const pathNodes = getPath(rootNodes, zoomedId);
      basePath = pathNodes.map((n) => n.id);
      baseAncestorCompleted = pathNodes.some((n) => n.isCompleted === true);
    }
  }

  const result: FlattenedNode[] = [];
  const hideCompleted = options?.hideCompleted ?? false;

  function traverse(
    nodes: OutlineNode[],
    depth: number,
    parentId: NodeId | null,
    currentPath: NodeId[],
    ancestorCompleted: boolean
  ) {
    for (const node of nodes) {
      const isSelfCompleted = node.isCompleted === true;
      if (hideCompleted && (isSelfCompleted || ancestorCompleted)) {
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
        isAncestorCompleted: ancestorCompleted,
      });

      // 접혀있지 않은 자식 노드만 전개
      if (hasChildren && !isFolded) {
        traverse(
          node.children,
          depth + 1,
          node.id,
          nodePath,
          ancestorCompleted || isSelfCompleted
        );
      }
    }
  }

  traverse(displayNodes, 0, zoomedId || null, basePath, baseAncestorCompleted);
  return result;
}
