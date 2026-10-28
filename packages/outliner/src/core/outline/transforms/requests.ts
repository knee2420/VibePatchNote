/**
 * @file requests.ts
 * @description 편집 동작을 패치 요청으로 옮기는 번역기
 *
 * 패치 엔진은 "기준 노드의 뒤 / 앞 / 안(맨 앞)"만 안다. (Workflowy 와 같은 말)
 * 들여쓰기, "맨 끝 자식으로", "바로 위로" 같은 편집 화면의 말은 여기서 그 세 가지로 풀어 쓴다.
 * 여기 함수들은 트리를 바꾸지 않고 요청만 만든다. 적용은 `applyPatch` 가 한다.
 */

import { ROOT_ID, getFlatNode, getTopmostIds } from '../model/flatTree';
import type {
  DropPosition,
  FlatNode,
  FlatNodeInput,
  FlatOutlineTree,
  NodeId,
  OutlineNode,
  TreePatchRequest,
} from '../model/types';

/** 접혀 있는 부모의 맨 앞이 아닌 자리에 넣을 때, 넣은 것이 보이도록 펼치는 요청 */
function unfoldRequests(tree: FlatOutlineTree, parentId: NodeId): TreePatchRequest[] {
  return getFlatNode(tree, parentId)?.isFolded
    ? [{ op: 'set_fold', id: parentId, isFolded: false }]
    : [];
}

/** `parentId` 의 자식 중 `skip` 에 없는 마지막 것 */
function lastChildExcept(parent: FlatNode, skip: ReadonlySet<NodeId>): NodeId | null {
  for (let i = parent.childIds.length - 1; i >= 0; i--) {
    if (!skip.has(parent.childIds[i])) return parent.childIds[i];
  }
  return null;
}

/** `targetId` 바로 앞의 형제 중 `skip` 에 없는 가장 가까운 것 */
function previousSiblingExcept(
  tree: FlatOutlineTree,
  targetId: NodeId,
  skip: ReadonlySet<NodeId>
): NodeId | null {
  const parentId = tree.nodes.get(targetId)?.parentId;
  const siblings = parentId == null ? [] : (tree.nodes.get(parentId)?.childIds ?? []);
  for (let i = siblings.indexOf(targetId) - 1; i >= 0; i--) {
    if (!skip.has(siblings[i])) return siblings[i];
  }
  return null;
}

/** `targetId` 바로 뒤의 형제 중 `skip` 에 없는 가장 가까운 것 */
function nextSiblingExcept(
  tree: FlatOutlineTree,
  targetId: NodeId,
  skip: ReadonlySet<NodeId>
): NodeId | null {
  const parentId = tree.nodes.get(targetId)?.parentId;
  const siblings = parentId == null ? [] : (tree.nodes.get(parentId)?.childIds ?? []);
  const startIndex = siblings.indexOf(targetId);
  if (startIndex === -1) return null;
  for (let i = startIndex + 1; i < siblings.length; i++) {
    if (!skip.has(siblings[i])) return siblings[i];
  }
  return null;
}

/**
 * 노드들을 대상 기준 자리로 옮기는 요청. 대상이 없으면 빈 배열이다.
 * 대상에 `ROOT_ID` 를 주면 맨 위 단계의 맨 앞(inside-start) 또는 맨 끝(inside)이다.
 */
export function moveRequests(
  tree: FlatOutlineTree,
  ids: NodeId[],
  targetId: NodeId,
  position: DropPosition
): TreePatchRequest[] {
  const target = tree.nodes.get(targetId);
  if (!target || ids.length === 0) return [];
  const moving = new Set(ids);

  switch (position) {
    case 'after':
      return [{ op: 'move', ids, under: targetId, inside: false }];

    case 'inside-start':
      return [{ op: 'move', ids, under: targetId, inside: true }];

    case 'before': {
      const previous = previousSiblingExcept(tree, targetId, moving);
      if (previous) return [{ op: 'move', ids, under: previous, inside: false }];
      return target.parentId === null
        ? []
        : [{ op: 'move', ids, under: target.parentId, inside: true }];
    }

    case 'inside': {
      const last = lastChildExcept(target, moving);
      if (!last) return [{ op: 'move', ids, under: targetId, inside: true }];
      return [{ op: 'move', ids, under: last, inside: false }, ...unfoldRequests(tree, targetId)];
    }
  }
}

/**
 * 새 노드들을 대상 기준 자리에 넣는 요청. 대상이 없으면 빈 배열이다.
 * 만들어진 노드의 id 는 첫 번째 요청의 결과(`createdIds`)에 담긴다.
 */
export function insertRequests(
  tree: FlatOutlineTree,
  targetId: NodeId,
  position: DropPosition,
  items: FlatNodeInput[]
): TreePatchRequest[] {
  const target = tree.nodes.get(targetId);
  if (!target) return [];

  switch (position) {
    case 'after':
      return [{ op: 'insert_after', targetId, items }];

    case 'before':
      return [{ op: 'insert_before', targetId, items }];

    case 'inside-start':
      return [{ op: 'insert_after', targetId, items, inside: true }];

    case 'inside': {
      const last = target.childIds.at(-1);
      if (last === undefined) return [{ op: 'insert_after', targetId, items, inside: true }];
      return [{ op: 'insert_after', targetId: last, items }, ...unfoldRequests(tree, targetId)];
    }
  }
}

/** 들여쓰기: 바로 위 형제의 마지막 자식으로 옮기는 요청. 위 형제가 없으면 빈 배열이다. */
export function indentRequests(tree: FlatOutlineTree, id: NodeId): TreePatchRequest[] {
  const previous = previousSiblingExcept(tree, id, new Set());
  return previous ? moveRequests(tree, [id], previous, 'inside') : [];
}

/** 내어쓰기: 부모의 바로 다음 형제로 옮기는 요청. 이미 맨 위 단계면 빈 배열이다. */
export function outdentRequests(tree: FlatOutlineTree, id: NodeId): TreePatchRequest[] {
  const parentId = getFlatNode(tree, id)?.parentId;
  return parentId == null || parentId === ROOT_ID
    ? []
    : [{ op: 'move', ids: [id], under: parentId, inside: false }];
}

/**
 * 노드(들)를 이전 형제 위('up') 또는 다음 형제 아래('down')로 한 칸 옮기는 요청.
 * 더 이상 위/아래로 갈 수 없으면 빈 배열이다.
 */
export function stepMoveRequests(
  tree: FlatOutlineTree,
  ids: NodeId[],
  direction: 'up' | 'down'
): TreePatchRequest[] {
  const topmost = getTopmostIds(tree, ids);
  if (topmost.length === 0) return [];
  const moving = new Set(topmost);

  if (direction === 'up') {
    const firstId = topmost[0];
    const previous = previousSiblingExcept(tree, firstId, moving);
    if (!previous) return [];
    return moveRequests(tree, topmost, previous, 'before');
  } else {
    const lastId = topmost[topmost.length - 1];
    const next = nextSiblingExcept(tree, lastId, moving);
    if (!next) return [];
    return moveRequests(tree, topmost, next, 'after');
  }
}

/** 중첩 노드들을 새로 만들 노드의 입력으로 바꾼다. id 와 시각은 버린다. (엔진이 새로 정한다) */
export function toNodeInputs(nodes: OutlineNode[]): FlatNodeInput[] {
  return nodes.map((node) => {
    const input: Partial<OutlineNode> = { ...node };
    delete input.id;
    delete input.createdAt;
    delete input.updatedAt;
    return { ...input, children: toNodeInputs(node.children ?? []) } as FlatNodeInput;
  });
}

/** 트리의 노드 하나를 하위째 복제할 때 쓸 입력. 없는 노드면 null */
export function subtreeInput(tree: FlatOutlineTree, id: NodeId): FlatNodeInput | null {
  const node = getFlatNode(tree, id);
  if (!node) return null;

  const input: Partial<FlatNode> = { ...node };
  delete input.id;
  delete input.parentId;
  delete input.childIds;
  delete input.createdAt;
  delete input.updatedAt;

  const children: FlatNodeInput[] = [];
  for (const childId of node.childIds) {
    const child = subtreeInput(tree, childId);
    if (child) children.push(child);
  }
  return { ...input, children } as FlatNodeInput;
}
