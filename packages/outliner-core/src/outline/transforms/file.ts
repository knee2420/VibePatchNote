/**
 * @file file.ts
 * @description 불릿에 딸린 파일을 붙이고, 떼고, 고치는 변형 (Transform)
 */

import { produce } from 'immer';
import { findParentAndSiblings } from '../internal/locate';
import type { NodeId, OutlineNode, OutlineNodeFile } from '../model/types';

/** 불릿에 파일을 붙인다. `file` 이 null 이면 뗀다. */
export function setNodeFile(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  file: OutlineNodeFile | null
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    if (!lookup) return;

    const node = lookup.siblings[lookup.index];
    if (file === null) {
      delete node.file;
    } else {
      node.file = file;
    }
    node.updatedAt = Date.now();
    success = true;
  });

  return { success, newNodes };
}

/**
 * 붙어 있는 파일의 일부(주소, 종류별 옵션)를 고친다.
 * `options: undefined` 로 넘기면 옵션을 지운다.
 */
export function updateNodeFile(
  rootNodes: OutlineNode[],
  targetId: NodeId,
  patch: Partial<OutlineNodeFile>
): { success: boolean; newNodes: OutlineNode[] } {
  let success = false;

  const newNodes = produce(rootNodes, (draft) => {
    const lookup = findParentAndSiblings(draft as OutlineNode[], targetId);
    const node = lookup?.siblings[lookup.index];
    if (!node?.file) return;

    const next: OutlineNodeFile = { ...node.file, ...patch };
    if (next.options === undefined) delete next.options;
    node.file = next;
    node.updatedAt = Date.now();
    success = true;
  });

  return { success, newNodes };
}
