/**
 * @file move.ts
 * @description 노드의 임의 위치/부모 재배치 연산자 (Reparenting & Reordering)
 *
 * 칸반 보드에서 다른 컬럼으로 카드를 옮기거나,
 * 불릿 뷰에서 드래그 앤 드롭으로 임의의 부모/인덱스로 노드를 이동시킬 때 사용합니다.
 */

import { produce } from 'immer';
import { findParentAndSiblings } from '../internal/locate';
import type { NodeId, OutlineNode } from '../model/types';
import { findNode } from '../queries/find';

export interface MoveNodeParams {
  targetId: NodeId;
  /** 새 부모 노드 ID (null이면 최상위 루트 레벨로 이동) */
  newParentId: NodeId | null;
  /** 새 부모 내에서의 삽입 인덱스 */
  newIndex: number;
}

export interface MoveNodeResult {
  success: boolean;
  newNodes: OutlineNode[];
}

/**
 * 특정 노드를 새 부모의 지정 인덱스로 원자적으로 이동
 * - 자기 자신이나 자신의 하위 자손 노드로 이동하려는 순환 참조 시도는 차단(안전 가드)
 */
export function moveNode(
  rootNodes: OutlineNode[],
  params: { targetId: NodeId; newParentId: NodeId | null; newIndex: number }
): MoveNodeResult {
  const { targetId, newParentId, newIndex } = params;

  // 1. 자기 자신으로의 이동 차단
  if (targetId === newParentId) {
    return { success: false, newNodes: rootNodes };
  }

  // 2. 자신의 하위 자손으로의 이동 차단 (순환 트리 방지)
  if (newParentId !== null) {
    const targetNode = findNode(rootNodes, targetId);
    if (targetNode && findNode(targetNode.children, newParentId)) {
      return { success: false, newNodes: rootNodes };
    }
  }

  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    // 3. 기존 위치에서 노드 추출 (detach)
    const sourceLookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!sourceLookup) {
      return;
    }

    const [detachedNode] = sourceLookup.siblings.splice(sourceLookup.index, 1);
    if (!detachedNode) {
      return;
    }

    // 4. 대상 위치 탐색 및 삽입 (attach)
    if (newParentId === null) {
      // 최상위 루트 배열로 이동
      const clampedIndex = Math.max(0, Math.min(newIndex, draft.length));
      draft.splice(clampedIndex, 0, detachedNode);
      detachedNode.updatedAt = Date.now();
      success = true;
    } else {
      // 특정 부모 노드의 children 으로 이동
      const targetParentLookup = findParentAndSiblings(draft as OutlineNode[], newParentId);
      if (!targetParentLookup) {
        // 부모를 못 찾으면 복구(원위치 복귀)
        sourceLookup.siblings.splice(sourceLookup.index, 0, detachedNode);
        return;
      }

      const targetParent = targetParentLookup.siblings[targetParentLookup.index];
      const clampedIndex = Math.max(0, Math.min(newIndex, targetParent.children.length));
      targetParent.children.splice(clampedIndex, 0, detachedNode);
      targetParent.isFolded = false; // 카드가 들어가면 자동 펼침
      detachedNode.updatedAt = Date.now();
      targetParent.updatedAt = Date.now();
      success = true;
    }
  });

  return { success, newNodes };
}
