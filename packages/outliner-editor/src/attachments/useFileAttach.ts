/**
 * @file useFileAttach.ts
 * @description 불릿에 파일을 붙이는 두 가지 길: 골라서 붙이기, 받아서(끌어다 놓기·붙여 넣기) 붙이기
 */

import { useCallback } from 'react';
import type { NodeId } from '@vibe/outliner-core';
import { useEditorStore, useOutlineHost } from '../session/context';

/** 운영체제에서 파일을 끌고 들어온 것인가 (불릿을 끄는 것과 구분한다) */
export function isFileDrag(e: { dataTransfer: DataTransfer }): boolean {
  return Array.from(e.dataTransfer.types).includes('Files');
}

export function useFileAttach() {
  const { files } = useOutlineHost();
  const attachFiles = useEditorStore((s) => s.attachFiles);

  // 호스트의 파일 고르기 창에서 하나를 골라 붙인다.
  const pickAndAttach = useCallback(
    async (nodeId: NodeId) => {
      if (!files) return;
      try {
        const target = await files.pick();
        if (target) attachFiles(nodeId, [target]);
      } catch (err) {
        console.error('파일 붙이기 실패:', err);
      }
    },
    [files, attachFiles]
  );

  // 끌어다 놓거나 붙여 넣은 파일을 호스트가 받아 들이게 한 뒤 붙인다.
  const importAndAttach = useCallback(
    async (nodeId: NodeId, incoming: File[]) => {
      if (!files || incoming.length === 0) return;
      try {
        const targets = await files.importFiles(incoming);
        attachFiles(nodeId, targets);
      } catch (err) {
        console.error('파일 받아 붙이기 실패:', err);
      }
    },
    [files, attachFiles]
  );

  return { canAttach: files !== undefined, pickAndAttach, importAndAttach };
}
