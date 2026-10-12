/**
 * @file useKeyOrchestrator.ts
 * @description 아웃라인 키보드 인터랙션(Enter, Tab, Backspace, 방향키, 빠른 조작 단축키) 오케스트레이션 훅
 */

import { type KeyboardEvent, useCallback } from 'react';
import { useWorkspaceStore } from '@/entities/workspace';
import { useNodeActions } from './useNodeActions';
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
  const store = useWorkspaceStore();
  const { toggleCompleted, startNoteEdit, removeNode } = useNodeActions();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const targetElement = e.currentTarget;
      const caretPos = getCaretCharacterOffsetWithin(targetElement);
      const currentText = targetElement.textContent || '';
      const isModifier = e.ctrlKey || e.metaKey;

      // 0. 빠른 조작 단축키 (우클릭 메뉴와 같은 동작)
      // Ctrl+Enter: 완료 토글
      if (e.key === 'Enter' && isModifier && !e.nativeEvent.isComposing) {
        e.preventDefault();
        toggleCompleted(nodeId);
        return;
      }

      // Shift+Enter: 부연설명 노트 열기
      if (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        startNoteEdit(nodeId);
        return;
      }

      // Ctrl+Shift+Backspace: 이 불릿 삭제
      // (Ctrl+Backspace 는 "앞 단어 지우기"라서 불릿 삭제에 쓰지 않는다)
      if (e.key === 'Backspace' && isModifier && e.shiftKey) {
        e.preventDefault();
        const current = flattenedNodes.find((n) => n.id === nodeId);
        if (!current) return;
        const prevId = getNextFocusId(flattenedNodes, nodeId, 'up');
        const prevTextLength = flattenedNodes.find((n) => n.id === prevId)?.node.text.length ?? 0;
        if (removeNode(current) && prevId) {
          store.setFocus(prevId, prevTextLength);
        }
        return;
      }

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

        // 먼저 지우고, 실제로 지워졌을 때에만 글자를 합치고 포커스를 옮긴다.
        if (currentText.length === 0) {
          if (store.deleteNode(nodeId)) {
            store.setFocus(prevId, prevText.length);
          }
        } else {
          const { mergedText, caretOffset } = mergeTextAtCaret(prevText, currentText);
          if (store.deleteNode(nodeId)) {
            store.updateText(prevId, mergedText);
            store.setFocus(prevId, caretOffset);
          }
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
        // 현재 노드에 부연설명 노트가 있다면 다음 노드로 건너뛰지 않고 노트로 먼저 진입!
        const currentItem = flattenedNodes.find((n) => n.id === nodeId);
        if (currentItem?.node.note) {
          e.preventDefault();
          startNoteEdit(nodeId);
          return;
        }

        const nextId = getNextFocusId(flattenedNodes, nodeId, 'down');
        if (nextId) {
          e.preventDefault();
          store.setFocus(nextId, caretPos);
        }
        return;
      }
    },
    [nodeId, flattenedNodes, store, toggleCompleted, startNoteEdit, removeNode]
  );

  return { handleKeyDown };
}
