/**
 * @file useKeyOrchestrator.ts
 * @description 아웃라인 키보드 인터랙션(Enter, Tab, Backspace, 방향키, 빠른 조작 단축키) 오케스트레이션 훅
 */

import { type KeyboardEvent, useCallback } from 'react';
import { useEditorStore } from '../session/context';
import { winOf } from '../session/host';
import { useNodeActions } from './useNodeActions';
import { useOutlineClipboard } from './useOutlineClipboard';
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
  const sel = winOf(element).getSelection();
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
  const store = useEditorStore((s) => s);
  const { toggleCompleted, startNoteEdit, removeNode } = useNodeActions();
  const { copyNodes, cutNodes } = useOutlineClipboard();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const targetElement = e.currentTarget;
      const caretPos = getCaretCharacterOffsetWithin(targetElement);
      const currentText = targetElement.textContent || '';
      const isModifier = e.ctrlKey || e.metaKey;

      // 0. 빠른 조작 단축키 (우클릭 메뉴와 같은 동작)
      // Ctrl+Z: 실행 취소 (Undo)
      if (e.key.toLowerCase() === 'z' && isModifier && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        store.undo();
        return;
      }

      // Ctrl+Y 또는 Ctrl+Shift+Z: 다시 실행 (Redo)
      if (
        isModifier &&
        ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        store.redo();
        return;
      }

      // Ctrl+A: 1회차 전체 글자 선택 후 2회차 누르면 불릿 블록 선택 모드로 전환 (Workflowy 스타일)
      if (e.key.toLowerCase() === 'a' && isModifier && !e.nativeEvent.isComposing) {
        const sel = winOf(targetElement).getSelection();
        const selectedText = sel ? sel.toString() : '';
        if (selectedText.length === currentText.length) {
          e.preventDefault();
          sel?.removeAllRanges();
          store.selectNodes([nodeId]);
          return;
        }
      }

      // Ctrl+Shift+C: 현재 불릿(서브트리 포함) 전체 복사
      if (e.key.toLowerCase() === 'c' && isModifier && e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void copyNodes([nodeId]);
        return;
      }

      // Ctrl+Shift+X: 현재 불릿(서브트리 포함) 잘라내기
      if (e.key.toLowerCase() === 'x' && isModifier && e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void cutNodes([nodeId]);
        return;
      }

      // Ctrl+Enter: 완료 토글
      if (e.key === 'Enter' && isModifier && !e.nativeEvent.isComposing) {
        e.preventDefault();
        e.stopPropagation();
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
        const current = flattenedNodes.find((n) => n.id === nodeId);
        if (!current) return;
        e.preventDefault();
        const prevId = getNextFocusId(flattenedNodes, nodeId, 'up');
        const prevTextLength = flattenedNodes.find((n) => n.id === prevId)?.node.text.length ?? 0;
        void removeNode(current).then((removed) => {
          if (removed && prevId) store.setFocus(prevId, prevTextLength);
        });
        return;
      }

      // 1. Enter: 새 노드 생성 및 텍스트 분할
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();

        // 글자를 나누고 새 불릿을 만드는 것까지가 한 동작이다. (실행 취소 한 번에 함께 되돌아간다)
        const { before, after } = splitTextAtCaret(currentText, caretPos);
        store.splitNode(nodeId, before, after);
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

        // 이 불릿을 지우고 글자를 윗줄에 합치는 것까지가 한 동작이다. 하위가 있는 불릿은 지워지지 않는다.
        const { mergedText, caretOffset } = mergeTextAtCaret(prevText, currentText);
        store.joinWithPrevious(nodeId, prevId, mergedText, caretOffset);
        return;
      }

      // 4. Alt+화살표: 불릿 줄 위/아래 순서 이동
      if (e.key === 'ArrowUp' && e.altKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        store.setFocus(nodeId, caretPos);
        const moved = store.moveNodesStep([nodeId], 'up');
        if (moved) {
          winOf(targetElement).requestAnimationFrame(() => {
            targetElement.focus();
            store.setFocus(nodeId, caretPos);
          });
        }
        return;
      }

      if (e.key === 'ArrowDown' && e.altKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        store.setFocus(nodeId, caretPos);
        const moved = store.moveNodesStep([nodeId], 'down');
        if (moved) {
          winOf(targetElement).requestAnimationFrame(() => {
            targetElement.focus();
            store.setFocus(nodeId, caretPos);
          });
        }
        return;
      }

      // 5. 방향키 이동
      if (e.key === 'ArrowUp' && !e.shiftKey && !e.altKey) {
        const prevId = getNextFocusId(flattenedNodes, nodeId, 'up');
        if (prevId) {
          e.preventDefault();
          store.setFocus(prevId, caretPos);
        }
        return;
      }

      if (e.key === 'ArrowDown' && !e.shiftKey && !e.altKey) {
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
    [nodeId, flattenedNodes, store, toggleCompleted, startNoteEdit, removeNode, copyNodes, cutNodes]
  );

  return { handleKeyDown };
}
