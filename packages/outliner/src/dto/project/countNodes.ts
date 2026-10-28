/**
 * @file countNodes.ts
 * @description 불릿 트리의 불릿 수 세기 (미리보기에 "불릿 N개"로 보여주는 값)
 */

import type { OutlineNode } from '../../core';

export function countNodes(nodes: OutlineNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}
