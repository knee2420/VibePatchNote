/**
 * @file useKeyOrchestrator.ts
 * @description 아웃라인 키보드 인터랙션(Enter, Tab, Backspace, 방향키) 오케스트레이션 훅
 */

import { type KeyboardEvent, useCallback } from 'react';
import { useTreeStore } from '@/entities/outline-document';
import {
  type FlattenedNode,
  type NodeId,
  splitTextAtCaret,
  mergeTextAtCaret,
  getNextFocusId,
} from '@vibe/outliner-core';

/** Selection API 기반 캐럿 문자열 오프셋 측정 */
export function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  let caretOffset = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
}

export function useKeyOrchestrator(
  nodeId: NodeId,
  flattenedNodes: FlattenedNode[]
) {
  const store = useTreeStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const targetElement = e.currentTarget;
      const caretPos = getCaretCharacterOffsetWithin(targetElement);
      const currentText = targetElement.textContent || '';

      // 1. Enter: 새 노드 생성 및 텍스트 분할
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();

        const { before, after } = splitTextAtCaret(currentText, caretPos);
        store.updateText(nodeId, before);

        const createdId = store.insertAfter(nodeId, after);
        if (createdId) {
          store.setFocus(createdId, 0);
        }
        return;
      }

      // 2. Tab: 들여쓰기 / Shift+Tab: 내어쓰기
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          store.outdent(nodeId);
        } else {
          store.indent(nodeId);
        }
        return;
      }

      // 3. Backspace: 글자 맨 앞(caret=0)에서 병합 또는 삭제
      if (e.key === 'Backspace' && caretPos === 0 && !e.nativeEvent.isComposing) {
        const prevId = getNextFocusId(flattenedNodes, nodeId, 'up');
        if (!prevId) return;

        e.preventDefault();

        const prevItem = flattenedNodes.find((n) => n.id === prevId);
        const prevText = prevItem?.node.text || '';

        if (currentText.length === 0) {
          store.deleteNode(nodeId);
          store.setFocus(prevId, prevText.length);
        } else {
          const { mergedText, caretOffset } = mergeTextAtCaret(prevText, currentText);
          store.updateText(prevId, mergedText);
          store.deleteNode(nodeId);
          store.setFocus(prevId, caretOffset);
        }
        return;
      }

      // 4. 방향키 이동
      if (e.key === 'ArrowUp' && !e.shiftKey) {
        const prevId = getNextFocusId(flattenedNodes, nodeId, 'up');
        if (prevId) {
          e.preventDefault();
          store.setFocus(prevId, caretPos);
        }
        return;
      }

      if (e.key === 'ArrowDown' && !e.shiftKey) {
        const nextId = getNextFocusId(flattenedNodes, nodeId, 'down');
        if (nextId) {
          e.preventDefault();
          store.setFocus(nextId, caretPos);
        }
        return;
      }
    },
    [nodeId, flattenedNodes, store]
  );

  return { handleKeyDown };
}
