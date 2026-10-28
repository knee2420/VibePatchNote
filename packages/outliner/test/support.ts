/**
 * @file support.ts
 * @description 편집 스토어 테스트가 함께 쓰는 가짜 호스트와 트리 적는 도구
 */

import type { OutlineNode } from '../src/core';
import { createOutlineEditorStore, type OutlineDocumentPort } from '../src/editor/session/editorStore';

export const leaf = (id: string, extra: Partial<OutlineNode> = {}): OutlineNode => ({
  id,
  text: id,
  children: [],
  ...extra,
});

export const branch = (
  id: string,
  children: OutlineNode[],
  extra: Partial<OutlineNode> = {}
): OutlineNode => ({ id, text: id, children, ...extra });

/** 중첩 트리를 "글자(자식들)" 꼴로 적는다. */
export function shape(nodes: OutlineNode[]): string {
  return nodes
    .map((node) => (node.children.length > 0 ? `${node.text}(${shape(node.children)})` : node.text))
    .join(' ');
}

/** 호스트 흉내: 돌려받은 트리를 들고 있고, 몇 번 돌려받았는지 센다. */
export function createEditor(initialRoots: OutlineNode[]) {
  let roots = initialRoots;
  let commits = 0;
  const port: OutlineDocumentPort = {
    getRoots: () => roots,
    commitRoots: (next) => {
      roots = next;
      commits++;
    },
    setDefaultView: () => {},
  };
  const store = createOutlineEditorStore(port);

  return {
    store,
    act: () => store.getState(),
    roots: () => roots,
    shape: () => shape(roots),
    commits: () => commits,
    /** 밖에서 파일이 바뀐 것처럼 호스트의 트리를 통째로 바꾼다. */
    replaceFromOutside: (next: OutlineNode[]) => {
      roots = next;
    },
  };
}
