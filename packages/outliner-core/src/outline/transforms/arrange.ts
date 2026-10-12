/**
 * @file arrange.ts
 * @description 여러 노드를 한꺼번에 재배치·복제·접기 하는 연산자 (마우스 조작용)
 *
 * 드래그 앤 드롭, "이동" 메뉴, 여러 불릿 선택 후 묶음 조작이 모두 이 함수들을 쓴다.
 * 놓을 자리는 "대상 노드 기준 어디에"로 표현한다.
 */

import { produce } from 'immer';
import { findParentAndSiblings } from '../internal/locate';
import { generateNodeId } from '../model/id';
import type { NodeId, OutlineNode, ViewMode } from '../model/types';
import { findNode } from '../queries/find';

/**
 * 대상 노드 기준으로 놓을 자리
 * - before / after : 대상의 바로 위 / 바로 아래 형제
 * - inside         : 대상의 자식 맨 끝
 * - inside-start   : 대상의 자식 맨 앞
 */
export type DropPosition = 'before' | 'after' | 'inside' | 'inside-start';

export interface ArrangeResult {
  success: boolean;
  newNodes: OutlineNode[];
}

/**
 * 고른 노드들 중 "맨 위" 노드만 문서 순서대로 남긴다.
 * (부모와 자식을 함께 골랐다면 부모만 옮기면 자식은 따라온다)
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

/** 대상이 옮기려는 노드 자신이거나 그 하위에 있는지 (그런 자리로는 옮길 수 없다) */
function isInsideAny(rootNodes: OutlineNode[], sourceIds: NodeId[], targetId: NodeId): boolean {
  return sourceIds.some((id) => {
    if (id === targetId) return true;
    const source = findNode(rootNodes, id);
    return source !== null && findNode(source.children, targetId) !== null;
  });
}

/** 초안 트리의 지정한 자리에 노드들을 끼워 넣는다. 대상을 못 찾으면 false */
function insertAt(
  draft: OutlineNode[],
  nodes: OutlineNode[],
  targetId: NodeId | null,
  position: DropPosition
): boolean {
  if (targetId === null) {
    if (position === 'inside-start') draft.unshift(...nodes);
    else draft.push(...nodes);
    return true;
  }

  const lookup = findParentAndSiblings(draft, targetId);
  if (!lookup) return false;

  if (position === 'before') {
    lookup.siblings.splice(lookup.index, 0, ...nodes);
  } else if (position === 'after') {
    lookup.siblings.splice(lookup.index + 1, 0, ...nodes);
  } else {
    const target = lookup.siblings[lookup.index];
    if (position === 'inside-start') target.children.unshift(...nodes);
    else target.children.push(...nodes);
    // 안쪽으로 넣었으면 들어간 것이 보이도록 펼친다.
    target.isFolded = false;
    target.updatedAt = Date.now();
  }
  return true;
}

function cloneWithNewIds(node: OutlineNode, now: number): OutlineNode {
  return {
    ...node,
    id: generateNodeId(),
    children: node.children.map((child) => cloneWithNewIds(child, now)),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 노드들을 대상 기준 자리로 옮긴다. (`targetId` 가 null 이면 맨 위 단계)
 * 자기 자신이나 자신의 하위로 옮기려는 시도는 실패로 처리한다.
 */
export function moveNodes(
  rootNodes: OutlineNode[],
  sourceIds: NodeId[],
  targetId: NodeId | null,
  position: DropPosition
): ArrangeResult {
  const topmost = getTopmostNodeIds(rootNodes, sourceIds);
  if (topmost.length === 0) return { success: false, newNodes: rootNodes };
  if (targetId !== null) {
    if (!findNode(rootNodes, targetId) || isInsideAny(rootNodes, topmost, targetId)) {
      return { success: false, newNodes: rootNodes };
    }
  }

  let success = false;
  const newNodes = produce(rootNodes, (draft) => {
    const now = Date.now();
    const detached: OutlineNode[] = [];
    for (const id of topmost) {
      const lookup = findParentAndSiblings(draft as OutlineNode[], id);
      if (!lookup) continue;
      const [node] = lookup.siblings.splice(lookup.index, 1);
      node.updatedAt = now;
      detached.push(node);
    }
    success = insertAt(draft as OutlineNode[], detached, targetId, position);
  });

  return success ? { success, newNodes } : { success: false, newNodes: rootNodes };
}

/**
 * 노드들을 복제해 각 원본의 바로 아래에 둔다. (하위 트리 포함, id 는 모두 새로 발급)
 */
export function duplicateNodes(
  rootNodes: OutlineNode[],
  sourceIds: NodeId[]
): { createdIds: NodeId[]; newNodes: OutlineNode[] } {
  const topmost = getTopmostNodeIds(rootNodes, sourceIds);
  const createdIds: NodeId[] = [];

  const newNodes = produce(rootNodes, (draft) => {
    const now = Date.now();
    for (const id of topmost) {
      const lookup = findParentAndSiblings(draft as OutlineNode[], id);
      if (!lookup) continue;
      const copy = cloneWithNewIds(lookup.siblings[lookup.index], now);
      lookup.siblings.splice(lookup.index + 1, 0, copy);
      createdIds.push(copy.id);
    }
  });

  return { createdIds, newNodes };
}

/**
 * 노드들의 복제본을 대상 기준 자리에 둔다. 원본은 그대로 남는다. (Alt+드래그)
 */
export function duplicateNodesTo(
  rootNodes: OutlineNode[],
  sourceIds: NodeId[],
  targetId: NodeId | null,
  position: DropPosition
): ArrangeResult & { createdIds: NodeId[] } {
  const topmost = getTopmostNodeIds(rootNodes, sourceIds);
  const createdIds: NodeId[] = [];
  if (topmost.length === 0) return { success: false, newNodes: rootNodes, createdIds };

  let success = false;
  const newNodes = produce(rootNodes, (draft) => {
    const now = Date.now();
    const copies: OutlineNode[] = [];
    for (const id of topmost) {
      const source = findNode(draft as OutlineNode[], id);
      if (source) copies.push(cloneWithNewIds(source, now));
    }
    success = insertAt(draft as OutlineNode[], copies, targetId, position);
    if (success) createdIds.push(...copies.map((c) => c.id));
  });

  return success
    ? { success, newNodes, createdIds }
    : { success: false, newNodes: rootNodes, createdIds: [] };
}

/**
 * 노드와 그 하위 전체를 한 번에 접거나 펼친다.
 */
export function setFoldDeep(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  isFolded: boolean
): ArrangeResult {
  let success = false;
  const newNodes = produce(rootNodes, (draft) => {
    const target = findNode(draft as OutlineNode[], targetId);
    if (!target) return;

    function apply(node: OutlineNode) {
      if (node.children.length > 0) node.isFolded = isFolded;
      node.children.forEach(apply);
    }
    apply(target);
    success = true;
  });
  return { success, newNodes };
}

/** 노드와 그 하위에 접힌 곳이 하나도 없는지 (전부 펼쳐진 상태인지) */
export function isFullyExpanded(node: OutlineNode): boolean {
  if (node.children.length === 0) return true;
  return !node.isFolded && node.children.every(isFullyExpanded);
}

/**
 * 노드에 줌인했을 때 쓸 보기 방식(불릿/보드)을 지정하거나 해제한다.
 */
export function setNodesViewMode(
  rootNodes: OutlineNode[],
  targetIds: NodeId[],
  viewMode: ViewMode | undefined
): { count: number; newNodes: OutlineNode[] } {
  let count = 0;
  const targetSet = new Set(targetIds);

  const newNodes = produce(rootNodes, (draft) => {
    function traverse(nodes: OutlineNode[]) {
      for (const node of nodes) {
        if (targetSet.has(node.id) && node.viewMode !== viewMode) {
          if (viewMode === undefined) delete node.viewMode;
          else node.viewMode = viewMode;
          node.updatedAt = Date.now();
          count++;
        }
        if (node.children.length > 0) traverse(node.children);
      }
    }
    traverse(draft as OutlineNode[]);
  });

  return { count, newNodes };
}
