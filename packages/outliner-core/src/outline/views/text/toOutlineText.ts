/**
 * @file toOutlineText.ts
 * @description 트리를 들여쓴 목록 텍스트(Markdown 목록)로 내보내는 프로젝션
 */

import type { OutlineNode } from '../../model/types';

const INDENT = '  ';

/**
 * 노드들과 그 하위를 Markdown 중첩 목록으로 만든다.
 * - 할 일/완료 항목은 `- [ ]` / `- [x]`
 * - 노트는 항목 바로 아래 한 단계 들여쓴 줄로 붙인다.
 */
export function toOutlineText(nodes: OutlineNode[]): string {
  const lines: string[] = [];

  function traverse(currentNodes: OutlineNode[], depth: number) {
    for (const node of currentNodes) {
      const pad = INDENT.repeat(depth);
      if (node.nodeType === 'divider') {
        lines.push(`${pad}- ---`);
      } else {
        const isCheckable = node.nodeType === 'todo' || node.isCompleted;
        const box = isCheckable ? (node.isCompleted ? '[x] ' : '[ ] ') : '';
        lines.push(`${pad}- ${box}${node.text}`);
      }
      if (node.note) {
        for (const noteLine of node.note.split('\n')) {
          lines.push(`${pad}${INDENT}${noteLine}`);
        }
      }
      if (node.children.length > 0) traverse(node.children, depth + 1);
    }
  }

  traverse(nodes, 0);
  return lines.join('\n');
}
