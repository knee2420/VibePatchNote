/**
 * @file useFileAttach.ts
 * @description 불릿에 파일·소스를 붙이는 길: 파일 고르기, 외부 OS 파일 / 호스트(옵시디언 트리) 드롭, 클립보드 캡처 붙여넣기
 */

import { type DragEvent as ReactDragEvent, useCallback } from 'react';
import { type NodeId, findNode } from '@vibe/outliner-core';
import type { DroppedItem, OutlineFileHost } from '../session/host';
import { useEditorStore, useOutlineHost } from '../session/context';

/** 운영체제에서 파일을 끌고 들어온 것인가 (불릿을 끄는 것과 구분한다) */
export function isFileDrag(e: { dataTransfer: DataTransfer | null }): boolean {
  if (!e.dataTransfer) return false;
  return Array.from(e.dataTransfer.types).includes('Files');
}

/** 운영체제 파일 또는 호스트 내부(옵시디언 파일 탐색기 등) 소스 드래그 여부 확인 */
export function isAnyFileDrag(
  e: DragEvent | ReactDragEvent,
  hostFiles?: OutlineFileHost
): boolean {
  if (hostFiles?.isDraggingFile) {
    return hostFiles.isDraggingFile(e);
  }
  const dt = 'dataTransfer' in e ? e.dataTransfer : null;
  return dt ? Array.from(dt.types).includes('Files') : false;
}

/** 클립보드 데이터에서 이미지 및 첨부 파일 목록 안전하게 추출 (캡처 도구·스크린샷 대응) */
export function extractFilesFromClipboard(dataTransfer: DataTransfer): File[] {
  const result: File[] = [];

  // 1. dataTransfer.files 에 파일이 있으면 먼저 수집
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files.item(i);
      if (file) result.push(file);
    }
  }

  // 2. files 가 비어있을 때 items 에서 getAsFile() 확인 (캡처 도구의 이미지 클립보드 복사 대응)
  if (result.length === 0 && dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file' || item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) result.push(file);
      }
    }
  }

  return result;
}

export function useFileAttach() {
  const { files } = useOutlineHost();
  const getRoots = useEditorStore((s) => s.getRoots);
  const attachFiles = useEditorStore((s) => s.attachFiles);
  const updateText = useEditorStore((s) => s.updateText);
  const insertAfter = useEditorStore((s) => s.insertAfter);
  const appendChild = useEditorStore((s) => s.appendChild);
  const addBulletAtEnd = useEditorStore((s) => s.addBulletAtEnd);
  const batch = useEditorStore((s) => s.batch);

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
      if (!files || incoming.length === 0) return [];
      try {
        const targets = await files.importFiles(incoming);
        return attachFiles(nodeId, targets);
      } catch (err) {
        console.error('파일 받아 붙이기 실패:', err);
        return [];
      }
    },
    [files, attachFiles]
  );

  // 클립보드에서 캡처 이미지 또는 파일을 감지하여 대상 불릿에 첨부한다.
  const pasteClipboardFiles = useCallback(
    async (nodeId: NodeId, clipboardData: DataTransfer): Promise<boolean> => {
      if (!files) return false;
      const incoming = extractFilesFromClipboard(clipboardData);
      if (incoming.length === 0) return false;
      const attached = await importAndAttach(nodeId, incoming);
      return attached.length > 0;
    },
    [files, importAndAttach]
  );

  // 불릿 위에 외부 파일 또는 옵시디언 트리 소스를 드롭했을 때 처리
  const dropOnNode = useCallback(
    async (targetId: NodeId, e: DragEvent | ReactDragEvent): Promise<boolean> => {
      if (!files) return false;
      let items: DroppedItem[] = [];

      try {
        if (files.resolveDrop) {
          items = await files.resolveDrop(e);
        } else {
          const dt = 'dataTransfer' in e ? e.dataTransfer : null;
          if (dt && dt.files && dt.files.length > 0) {
            const targets = await files.importFiles(Array.from(dt.files));
            items = targets.map((fileTarget) => ({ fileTarget }));
          }
        }
      } catch (err) {
        console.error('드롭 소스 해석 실패:', err);
        return false;
      }

      if (items.length === 0) return false;

      const roots = getRoots();
      const targetNode = findNode(roots, targetId);
      if (!targetNode) return false;

      const isTargetEmpty = targetNode.text.trim() === '' && !targetNode.file;

      // 여러 개를 놓아도 한 동작이다. (실행 취소 한 번에 함께 되돌아간다)
      batch(() => {
        if (isTargetEmpty) {
          const first = items[0];
          let lastCreatedId = targetId;
          if (first.fileTarget) {
            attachFiles(targetId, [first.fileTarget]);
          } else if (first.text) {
            updateText(targetId, first.text);
          }

          for (const item of items.slice(1)) {
            const newId = insertAfter(lastCreatedId, item.text ?? '');
            if (newId) {
              lastCreatedId = newId;
              if (item.fileTarget) {
                attachFiles(newId, [item.fileTarget]);
              }
            }
          }
        } else {
          // 대상 불릿에 이미 내용이 있는 경우 하위 불릿으로 추가
          let lastCreatedId: NodeId | null = null;
          for (const item of items) {
            if (!lastCreatedId) {
              const newId = appendChild(targetId, item.text ?? '');
              if (newId) {
                lastCreatedId = newId;
                if (item.fileTarget) {
                  attachFiles(newId, [item.fileTarget]);
                }
              }
            } else {
              const newId = insertAfter(lastCreatedId, item.text ?? '');
              if (newId) {
                lastCreatedId = newId;
                if (item.fileTarget) {
                  attachFiles(newId, [item.fileTarget]);
                }
              }
            }
          }
        }
      });

      return true;
    },
    [files, getRoots, attachFiles, updateText, insertAfter, appendChild, batch]
  );

  // 트리 빈 영역에 드롭했을 때 맨 아래에 새 불릿을 생성하고 소스/파일 추가
  const dropOnTree = useCallback(
    async (e: DragEvent | ReactDragEvent): Promise<boolean> => {
      if (!files) return false;
      let items: DroppedItem[] = [];

      try {
        if (files.resolveDrop) {
          items = await files.resolveDrop(e);
        } else {
          const dt = 'dataTransfer' in e ? e.dataTransfer : null;
          if (dt && dt.files && dt.files.length > 0) {
            const targets = await files.importFiles(Array.from(dt.files));
            items = targets.map((fileTarget) => ({ fileTarget }));
          }
        }
      } catch (err) {
        console.error('트리 드롭 소스 해석 실패:', err);
        return false;
      }

      if (items.length === 0) return false;

      batch(() => {
        let lastCreatedId: NodeId | null = null;
        for (const item of items) {
          if (!lastCreatedId) {
            const newId = addBulletAtEnd();
            if (newId) {
              lastCreatedId = newId;
              if (item.text) updateText(newId, item.text);
              if (item.fileTarget) attachFiles(newId, [item.fileTarget]);
            }
          } else {
            const newId = insertAfter(lastCreatedId, item.text ?? '');
            if (newId) {
              lastCreatedId = newId;
              if (item.fileTarget) attachFiles(newId, [item.fileTarget]);
            }
          }
        }
      });

      return true;
    },
    [files, addBulletAtEnd, updateText, insertAfter, attachFiles, batch]
  );

  return {
    canAttach: files !== undefined,
    isDraggingFile: (e: DragEvent | ReactDragEvent) => isAnyFileDrag(e, files),
    pickAndAttach,
    importAndAttach,
    pasteClipboardFiles,
    dropOnNode,
    dropOnTree,
  };
}
