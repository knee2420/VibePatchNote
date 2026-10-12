/**
 * @file node.ts
 * @description immer 기반 고성능 불변 트리 노드 변형 엔진 (Transform)
 */

import { produce } from 'immer';
import { findParentAndSiblings } from '../internal/locate';
import { generateNodeId } from '../model/id';
import type { NodeId, OutlineNode, OutlineNodeType } from '../model/types';

/** 타깃 노드 바로 다음에 새 형제 노드 삽입 */
export function insertAfter(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  initialText = ''
): { newNodes: OutlineNode[]; createdNode: OutlineNode } {
  let createdNode: OutlineNode | null = null;

  const newNodes = produce(rootNodes, (draft) => {
    const newNode: OutlineNode = {
      id: generateNodeId(),
      text: initialText,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    createdNode = newNode;

    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) {
      draft.push(newNode);
    } else {
      lookup.siblings.splice(lookup.index + 1, 0, newNode);
    }
  });

  return { newNodes, createdNode: createdNode! };
}

/** 특정 부모의 마지막 자식으로 노드 추가 */
export function appendChild(
  rootNodes: OutlineNode[],
  parentId: NodeId,
  initialText = ''
): { newNodes: OutlineNode[]; createdNode: OutlineNode } {
  let createdNode: OutlineNode | null = null;

  const newNodes = produce(rootNodes, (draft) => {
    const newNode: OutlineNode = {
      id: generateNodeId(),
      text: initialText,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    createdNode = newNode;

    const lookup = findParentAndSiblings(draft as OutlineNode[], parentId);
    if (!lookup) {
      draft.push(newNode);
    } else {
      const target = lookup.siblings[lookup.index];
      target.children.push(newNode);
      target.isFolded = false; // 자식 추가 시 자동 펼침
    }
  });

  return { newNodes, createdNode: createdNode! };
}

/**
 * 들여쓰기 (Indent): 현재 노드를 바로 윗 형제 노드의 마지막 자식으로 이동
 */
export function indentNode(
  rootNodes: OutlineNode[],
  targetId: NodeId
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup || lookup.index === 0) {
      return; // 윗 형제가 없으면 들여쓰기 불가
    }

    const { siblings, index } = lookup;
    const prevSibling = siblings[index - 1];
    const [targetNode] = siblings.splice(index, 1);

    prevSibling.children.push(targetNode);
    prevSibling.isFolded = false;
    success = true;
  });

  return { success, newNodes };
}

/**
 * 내어쓰기 (Outdent): 현재 노드를 부모의 다음 형제 위치로 승격
 */
export function outdentNode(
  rootNodes: OutlineNode[],
  targetId: NodeId
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup || !lookup.parent) {
      return; // 이미 최상위 루트면 내어쓰기 불가
    }

    const parentLookup = findParentAndSiblings(draft as OutlineNode[], lookup.parent.id);
    if (!parentLookup) {
      return;
    }

    const [targetNode] = lookup.siblings.splice(lookup.index, 1);
    parentLookup.siblings.splice(parentLookup.index + 1, 0, targetNode);
    success = true;
  });

  return { success, newNodes };
}

/**
 * 노드 단일 삭제
 */
export function deleteNode(
  rootNodes: OutlineNode[],
  targetId: NodeId
): { success: boolean; newNodes: OutlineNode[]; deletedNode: OutlineNode | null } {
  let deletedNode: OutlineNode | null = null;
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) {
      return;
    }

    const [deleted] = lookup.siblings.splice(lookup.index, 1);
    deletedNode = deleted;
    success = true;
  });

  return { success, newNodes, deletedNode };
}

/**
 * 다중 노드 일괄 삭제 (Batch Delete)
 */
export function deleteNodes(
  rootNodes: OutlineNode[],
  targetIds: NodeId[]
): { count: number; newNodes: OutlineNode[] } {
  if (targetIds.length === 0) return { count: 0, newNodes: rootNodes };

  let count = 0;
  const targetSet = new Set(targetIds);

  const newNodes = produce(rootNodes, (draft) => {
    function purge(nodes: OutlineNode[]) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (targetSet.has(node.id)) {
          nodes.splice(i, 1);
          count++;
        } else if (node.children.length > 0) {
          purge(node.children);
        }
      }
    }
    purge(draft as OutlineNode[]);
  });

  return { count, newNodes };
}

/**
 * 노드 텍스트 갱신
 */
export function updateNodeText(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  newText: string
): { success: boolean; newNodes: OutlineNode[]; updatedNode?: OutlineNode } {
  let success = false;
  let updatedNode: OutlineNode | undefined;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) {
      return;
    }

    const node = lookup.siblings[lookup.index];
    node.text = newText;
    node.updatedAt = Date.now();
    updatedNode = node;
    success = true;
  });

  return { success, newNodes, updatedNode };
}

/**
 * 노드 서식 타입 일괄 변경 (Heading, To-do, Bullet 등)
 */
export function setNodesType(
  rootNodes: OutlineNode[],
  targetIds: NodeId[],
  nodeType: OutlineNodeType
): { count: number; newNodes: OutlineNode[] } {
  if (targetIds.length === 0) return { count: 0, newNodes: rootNodes };

  let count = 0;
  const targetSet = new Set(targetIds);

  const newNodes = produce(rootNodes, (draft) => {
    function traverse(nodes: OutlineNode[]) {
      for (const node of nodes) {
        if (targetSet.has(node.id)) {
          node.nodeType = nodeType;
          node.updatedAt = Date.now();
          count++;
        }
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    }
    traverse(draft as OutlineNode[]);
  });

  return { count, newNodes };
}

/**
 * 노드 완료 상태 일괄 토글/설정
 */
export function toggleNodesCompleted(
  rootNodes: OutlineNode[],
  targetIds: NodeId[],
  forceState?: boolean
): { count: number; newNodes: OutlineNode[] } {
  if (targetIds.length === 0) return { count: 0, newNodes: rootNodes };

  let count = 0;
  const targetSet = new Set(targetIds);
  const now = Date.now();

  const newNodes = produce(rootNodes, (draft) => {
    function traverse(nodes: OutlineNode[]) {
      for (const node of nodes) {
        if (targetSet.has(node.id)) {
          const nextState =
            typeof forceState === 'boolean' ? forceState : !node.isCompleted;
          node.isCompleted = nextState;
          node.completedAt = nextState ? now : undefined;
          node.updatedAt = now;
          count++;
        }
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    }
    traverse(draft as OutlineNode[]);
  });

  return { count, newNodes };
}

/**
 * 노드 부연 설명(노트) 갱신. 빈 문자열이면 노트를 없앤다.
 */
export function setNodeNote(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  note: string
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) {
      return;
    }

    const node = lookup.siblings[lookup.index];
    if (note === '') {
      delete node.note;
    } else {
      node.note = note;
    }
    node.updatedAt = Date.now();
    success = true;
  });

  return { success, newNodes };
}

/**
 * 노드 접기/펼치기 토글
 */
export function toggleFold(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  forceState?: boolean
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) {
      return;
    }

    const node = lookup.siblings[lookup.index];
    node.isFolded = typeof forceState === 'boolean' ? forceState : !node.isFolded;
    success = true;
  });

  return { success, newNodes };
}
