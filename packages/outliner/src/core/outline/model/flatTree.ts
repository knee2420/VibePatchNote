/**
 * @file flatTree.ts
 * @description ID 트리 모델 (Workflowy 방식) — 실행 중 불릿 트리의 원본
 *
 * 파일(.outline)은 중첩 트리로 저장하지만, 실행 중에는 노드를 id 로 지목하는 ID 트리를 원본으로 쓴다.
 * - 가상 뿌리 노드(ROOT_ID) 하나 아래에 모든 불릿이 달린다. (Workflowy 의 "Home")
 * - 올리기(importTree): 중첩 트리 → ID 트리. 파일을 읽었을 때 한 번.
 * - 내리기(projectTree): ID 트리 → 중첩 트리. 화면과 파일 저장이 읽는 모양.
 *   바뀌지 않은 가지는 이전에 내려 준 객체를 그대로 다시 쓴다.
 *
 * 트리를 바꾸는 일은 여기서 하지 않는다. 바꾸는 길은 패치 엔진(transforms/patch.ts) 하나다.
 */

import { generateNodeId } from './id';
import type { FlatNode, FlatOutlineTree, NodeId, OutlineNode } from './types';

/** 가상 뿌리 노드의 id. 파일에는 저장되지 않는다. */
export const ROOT_ID: NodeId = 'root';

/** 내려 준 중첩 노드 하나와, 그것을 만든 ID 트리 노드 */
interface ProjectedNode {
  flat: FlatNode;
  node: OutlineNode;
}

/** ID 트리를 중첩 트리로 내린 결과. 다음에 내릴 때 넘기면 바뀌지 않은 가지를 다시 쓴다. */
export interface TreeProjection {
  roots: OutlineNode[];
  byId: ReadonlyMap<NodeId, ProjectedNode>;
}

function rootNode(childIds: NodeId[]): FlatNode {
  return { id: ROOT_ID, text: '', parentId: null, childIds };
}

function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function createEmptyTree(): FlatOutlineTree {
  return { nodes: new Map([[ROOT_ID, rootNode([])]]) };
}

/**
 * 중첩 트리를 ID 트리로 올린다.
 * 파일에 같은 id 가 두 번 나오면(또는 뿌리 id 와 겹치면) 뒤에 나온 쪽에 새 id 를 준다. 내용은 버리지 않는다.
 */
export function importTree(rootNodes: OutlineNode[]): {
  tree: FlatOutlineTree;
  projection: TreeProjection;
} {
  const nodes = new Map<NodeId, FlatNode>();
  const byId = new Map<NodeId, ProjectedNode>();
  const seen = new Set<NodeId>([ROOT_ID]);

  function walk(list: OutlineNode[], parentId: NodeId): NodeId[] {
    return list.map((node) => {
      const reassigned = seen.has(node.id);
      const id = reassigned ? generateNodeId() : node.id;
      seen.add(id);

      const children = Array.isArray(node.children) ? node.children : [];
      const childIds = walk(children, id);

      const flat = { ...node, id, parentId, childIds } as FlatNode & { children?: unknown };
      delete flat.children;
      nodes.set(id, flat);
      // 받은 객체를 그대로 다시 내려 줄 수 있게 기억해 둔다. (고친 것이 없으면 저장 내용도 그대로다)
      if (!reassigned && children === node.children) byId.set(id, { flat, node });
      return id;
    });
  }

  nodes.set(ROOT_ID, rootNode(walk(rootNodes, ROOT_ID)));
  return { tree: { nodes }, projection: { roots: rootNodes, byId } };
}

/** 중첩 트리를 ID 트리로 올린다. */
export function treeToFlat(rootNodes: OutlineNode[]): FlatOutlineTree {
  return importTree(rootNodes).tree;
}

/**
 * ID 트리를 중첩 트리로 내린다.
 * `previous` 를 넘기면, 그때와 달라지지 않은 노드(자신과 하위 전체가 그대로인 노드)는 같은 객체를 돌려준다.
 */
export function projectTree(tree: FlatOutlineTree, previous?: TreeProjection): TreeProjection {
  const byId = new Map<NodeId, ProjectedNode>();

  function build(id: NodeId): OutlineNode | null {
    const flat = tree.nodes.get(id);
    if (!flat) return null;

    const children: OutlineNode[] = [];
    for (const childId of flat.childIds) {
      const child = build(childId);
      if (child) children.push(child);
    }

    const before = previous?.byId.get(id);
    if (before && before.flat === flat && sameItems(before.node.children, children)) {
      byId.set(id, before);
      return before.node;
    }

    const rest: Partial<FlatNode> = { ...flat };
    delete rest.id;
    delete rest.text;
    delete rest.parentId;
    delete rest.childIds;
    const node = { id: flat.id, text: flat.text, children, ...rest } as OutlineNode;
    byId.set(id, { flat, node });
    return node;
  }

  const roots: OutlineNode[] = [];
  for (const id of tree.nodes.get(ROOT_ID)?.childIds ?? []) {
    const node = build(id);
    if (node) roots.push(node);
  }

  return {
    roots: previous && sameItems(previous.roots, roots) ? previous.roots : roots,
    byId,
  };
}

/** ID 트리를 중첩 트리로 내린다. (.outline 파일에 저장하는 모양) */
export function flatToTree(tree: FlatOutlineTree): OutlineNode[] {
  return projectTree(tree).roots;
}

/** 불릿 하나를 찾는다. 가상 뿌리는 불릿이 아니므로 돌려주지 않는다. */
export function getFlatNode(tree: FlatOutlineTree, id: NodeId): FlatNode | undefined {
  return id === ROOT_ID ? undefined : tree.nodes.get(id);
}

/** `id` 가 `ancestorId` 자신이거나 그 하위에 있는지 */
export function isInSubtree(tree: FlatOutlineTree, ancestorId: NodeId, id: NodeId): boolean {
  let current: NodeId | null = id;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = tree.nodes.get(current)?.parentId ?? null;
  }
  return false;
}

/** 노드와 그 하위 전체의 id (문서 순서) */
export function collectSubtreeIds(tree: FlatOutlineTree, id: NodeId): NodeId[] {
  const result: NodeId[] = [];
  const stack: NodeId[] = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const node = tree.nodes.get(current);
    if (!node) continue;
    result.push(current);
    for (let i = node.childIds.length - 1; i >= 0; i--) stack.push(node.childIds[i]);
  }
  return result;
}

/**
 * 고른 노드들 중 "맨 위" 노드만 문서 순서대로 남긴다.
 * (부모와 자식을 함께 골랐다면 부모만 옮기면 자식은 따라온다)
 */
export function getTopmostIds(tree: FlatOutlineTree, ids: NodeId[]): NodeId[] {
  const wanted = new Set(ids.filter((id) => id !== ROOT_ID && tree.nodes.has(id)));
  const result: NodeId[] = [];
  if (wanted.size === 0) return result;

  function walk(id: NodeId) {
    for (const childId of tree.nodes.get(id)?.childIds ?? []) {
      if (wanted.has(childId)) result.push(childId);
      else walk(childId);
    }
  }
  walk(ROOT_ID);
  return result;
}

/**
 * `source` 트리의 접힘 상태를 `tree` 에 옮겨 입힌다. (양쪽에 다 있는 노드만)
 * 접기·펼치기는 화면 상태라서, 실행 취소로 예전 트리를 되살릴 때 지금 접어 둔 모양은 유지한다.
 */
export function withFoldStateOf(tree: FlatOutlineTree, source: FlatOutlineTree): FlatOutlineTree {
  let nodes: Map<NodeId, FlatNode> | null = null;
  for (const [id, node] of tree.nodes) {
    const other = source.nodes.get(id);
    if (!other || !!other.isFolded === !!node.isFolded) continue;
    nodes ??= new Map(tree.nodes);
    nodes.set(id, { ...node, isFolded: !!other.isFolded });
  }
  return nodes ? { nodes } : tree;
}

/**
 * 트리가 어긋난 곳을 찾아 설명을 돌려준다. 멀쩡하면 빈 배열이다.
 * - 가상 뿌리가 있고 부모가 없다.
 * - 모든 노드는 뿌리에서 정확히 한 번 닿는다. (고아·순환·중복 없음)
 * - 자식이 가리키는 부모와, 부모의 자식 목록이 서로 맞는다.
 */
export function checkTreeIntegrity(tree: FlatOutlineTree): string[] {
  const problems: string[] = [];
  const root = tree.nodes.get(ROOT_ID);
  if (!root) return ['가상 뿌리 노드가 없다'];
  if (root.parentId !== null) problems.push('가상 뿌리에 부모가 있다');

  const reached = new Set<NodeId>([ROOT_ID]);
  const stack: NodeId[] = [ROOT_ID];
  while (stack.length > 0) {
    const parentId = stack.pop()!;
    for (const childId of tree.nodes.get(parentId)?.childIds ?? []) {
      const child = tree.nodes.get(childId);
      if (!child) {
        problems.push(`${parentId} 의 자식 ${childId} 가 트리에 없다`);
        continue;
      }
      if (reached.has(childId)) {
        problems.push(`${childId} 가 두 번 이상 달려 있다`);
        continue;
      }
      if (child.parentId !== parentId) {
        problems.push(`${childId} 의 부모가 ${String(child.parentId)} 인데 ${parentId} 아래에 달려 있다`);
      }
      reached.add(childId);
      stack.push(childId);
    }
  }

  for (const id of tree.nodes.keys()) {
    if (!reached.has(id)) problems.push(`${id} 가 뿌리에서 닿지 않는다`);
  }
  return problems;
}
