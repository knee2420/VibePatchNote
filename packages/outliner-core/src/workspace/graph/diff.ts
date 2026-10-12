/**
 * @file diff.ts
 * @description 블록 레벨 트리 변경점(Diff) 계산 순수 함수
 */

import type { NodeId, OutlineNode } from '../../outline/model/types';

export interface BlockDiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  addedNodes: OutlineNode[];
  removedNodes: OutlineNode[];
  modifiedNodes: Array<{ before: OutlineNode; after: OutlineNode }>;
}

function collectNodeMap(nodes: OutlineNode[], map: Map<NodeId, OutlineNode>) {
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children.length > 0) {
      collectNodeMap(node.children, map);
    }
  }
}

/**
 * 과거 스냅샷 트리(before)와 현재 트리(after) 간의 블록 단위 변경점을 계산한다.
 */
export function diffSnapshots(
  beforeNodes: OutlineNode[],
  afterNodes: OutlineNode[]
): BlockDiffSummary {
  const beforeMap = new Map<NodeId, OutlineNode>();
  const afterMap = new Map<NodeId, OutlineNode>();

  collectNodeMap(beforeNodes, beforeMap);
  collectNodeMap(afterNodes, afterMap);

  const addedNodes: OutlineNode[] = [];
  const removedNodes: OutlineNode[] = [];
  const modifiedNodes: Array<{ before: OutlineNode; after: OutlineNode }> = [];
  let unchangedCount = 0;

  // After 기준 검사 (추가 및 수정)
  for (const [id, afterNode] of afterMap.entries()) {
    const beforeNode = beforeMap.get(id);
    if (!beforeNode) {
      addedNodes.push(afterNode);
    } else {
      const isTextChanged = beforeNode.text !== afterNode.text;
      const isCompletedChanged = beforeNode.isCompleted !== afterNode.isCompleted;
      const isNoteChanged = beforeNode.note !== afterNode.note;
      const isRefChanged = JSON.stringify(beforeNode.ref) !== JSON.stringify(afterNode.ref);

      if (isTextChanged || isCompletedChanged || isNoteChanged || isRefChanged) {
        modifiedNodes.push({ before: beforeNode, after: afterNode });
      } else {
        unchangedCount++;
      }
    }
  }

  // Before 기준 검사 (삭제)
  for (const [id, beforeNode] of beforeMap.entries()) {
    if (!afterMap.has(id)) {
      removedNodes.push(beforeNode);
    }
  }

  return {
    addedCount: addedNodes.length,
    removedCount: removedNodes.length,
    modifiedCount: modifiedNodes.length,
    unchangedCount,
    addedNodes,
    removedNodes,
    modifiedNodes,
  };
}
