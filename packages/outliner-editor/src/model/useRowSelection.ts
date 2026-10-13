/**
 * @file useRowSelection.ts
 * @description 마우스 및 키보드로 여러 불릿을 다중 선택하고 조작하는 선택 훅
 *
 * - 한 줄 안에서 끌면 평소처럼 글자가 선택되고, 다른 줄로 넘어가는 순간부터 "불릿 단위 선택"으로 바뀐다.
 * - Shift+클릭은 마지막으로 누른 줄부터 그 줄까지를 고른다.
 * - 다중 선택 상태에서 동작하는 전역 키보드 인터랙션:
 *   - Tab / Shift+Tab: 선택된 노드들 일괄 들여쓰기 / 내어쓰기
 *   - Ctrl+Enter / Cmd+Enter: 선택된 노드들 일괄 완료 토글
 *   - Delete / Backspace: 선택된 노드들 묶음 삭제
 *   - Ctrl+C / Cmd+C: 마크다운 들여쓰기 텍스트로 클립보드 복사
 *   - Ctrl+X / Cmd+X: 클립보드 복사 후 삭제 (잘라내기)
 *   - ArrowUp / ArrowDown: 선택 해제 후 첫/마지막 노드 기준으로 포커스 이동
 *   - Ctrl+A / Cmd+A: 전체 불릿 선택
 *   - Esc: 선택 해제
 * - 마우스 클릭 시 선택 해제 및 해당 줄로의 안전한 포커스 복원
 */

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from 'react';
import {
  type FlattenedNode,
  type NodeId,
  type OutlineNode,
  findNode,
  getNextFocusId,
  getTopmostNodeIds,
  toOutlineText,
} from '@vibe/outliner-core';
import { useEditorApi, useEditorStore, useEditorWindow } from '../session/context';
import { useNodeActions } from './useNodeActions';
import { extractFilesFromClipboard, useFileAttach } from '../attachments/useFileAttach';

function rowIdOf(element: Element | null): NodeId | null {
  return element?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId ?? null;
}

export function useRowSelection(flattenedNodes: FlattenedNode[]) {
  const selectNodes = useEditorStore((s) => s.selectNodes);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const hasSelection = useEditorStore((s) => s.selectedNodeIds.length > 0);
  const store = useEditorStore((s) => s);
  const { removeNodes } = useNodeActions();
  const { pasteClipboardFiles } = useFileAttach();
  const api = useEditorApi();
  const win = useEditorWindow();

  const anchorId = useRef<NodeId | null>(null);
  // 끄는 도중에도 항상 최신 줄 순서를 본다.
  const rows = useRef(flattenedNodes);
  useEffect(() => {
    rows.current = flattenedNodes;
  }, [flattenedNodes]);

  const selectRange = useCallback(
    (fromId: NodeId, toId: NodeId) => {
      const ids = rows.current.map((n) => n.id);
      const from = ids.indexOf(fromId);
      const to = ids.indexOf(toId);
      if (from === -1 || to === -1) return;
      selectNodes(ids.slice(Math.min(from, to), Math.max(from, to) + 1));
    },
    [selectNodes]
  );

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      // 불릿 점·화살표·손잡이·메뉴 같은 조작 요소는 선택을 건드리지 않는다.
      if (target.closest('[data-row-control]')) return;

      const rowId = rowIdOf(target);
      if (e.shiftKey && anchorId.current && rowId) {
        e.preventDefault();
        selectRange(anchorId.current, rowId);
        return;
      }

      // 이미 선택이 있는 상태에서 Shift 없이 누르면 선택 해제 및 포커스 정상화
      if (hasSelection) {
        clearSelection();
        if (rowId) {
          store.setFocus(rowId, 0);
        }
      }

      anchorId.current = rowId;
      if (!rowId) return;

      let isSelectingRows = false;
      const previousUserSelect = win.document.body.style.userSelect;

      const handleMove = (ev: MouseEvent) => {
        const current = rowIdOf(win.document.elementFromPoint(ev.clientX, ev.clientY));
        if (!current || !anchorId.current) return;
        // 같은 줄 안에서는 글자 선택으로 둔다.
        if (!isSelectingRows && current === anchorId.current) return;

        if (!isSelectingRows) {
          isSelectingRows = true;
          win.document.body.style.userSelect = 'none';
          if (win.document.activeElement instanceof HTMLElement) win.document.activeElement.blur();
        }
        win.getSelection()?.removeAllRanges();
        ev.preventDefault();
        selectRange(anchorId.current, current);
      };

      const handleUp = () => {
        win.document.body.style.userSelect = previousUserSelect;
        win.removeEventListener('mousemove', handleMove);
        win.removeEventListener('mouseup', handleUp);
      };

      win.addEventListener('mousemove', handleMove);
      win.addEventListener('mouseup', handleUp);
    },
    [clearSelection, hasSelection, selectRange, store, win]
  );

  // 고른 상태에서 전역 키보드 오케스트레이션
  useEffect(() => {
    if (!hasSelection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = win.document.activeElement;
      const isTyping =
        active instanceof HTMLElement &&
        (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

      const isModifier = e.ctrlKey || e.metaKey;
      const selectedIds = api.getState().selectedNodeIds;
      if (selectedIds.length === 0) return;

      // 1. Esc: 선택 해제
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // 2. Tab / Shift+Tab: 선택된 노드들 일괄 들여쓰기 / 내어쓰기
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          store.outdentNodes(selectedIds);
        } else {
          store.indentNodes(selectedIds);
        }
        return;
      }

      // 3. Ctrl+Enter: 일괄 완료/미완료 토글
      if (e.key === 'Enter' && isModifier && !e.isComposing) {
        e.preventDefault();
        store.setNodesCompleted(selectedIds);
        return;
      }

      // 4. Delete / Backspace: 묶음 삭제
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
        e.preventDefault();
        void removeNodes(selectedIds);
        return;
      }

      // 5. Ctrl+C: 선택된 노드들을 마크다운 들여쓰기 텍스트로 복사
      if (isModifier && e.key.toLowerCase() === 'c' && !isTyping) {
        const roots = api.getState().getRoots();
        const topmost = getTopmostNodeIds(roots, selectedIds);
        const nodes = topmost
          .map((id) => findNode(roots, id))
          .filter((n): n is OutlineNode => n !== null);
        if (nodes.length > 0) {
          e.preventDefault();
          const text = toOutlineText(nodes);
          void win.navigator.clipboard.writeText(text);
        }
        return;
      }

      // 6. Ctrl+X: 잘라내기 (복사 후 삭제)
      if (isModifier && e.key.toLowerCase() === 'x' && !isTyping) {
        const roots = api.getState().getRoots();
        const topmost = getTopmostNodeIds(roots, selectedIds);
        const nodes = topmost
          .map((id) => findNode(roots, id))
          .filter((n): n is OutlineNode => n !== null);
        if (nodes.length > 0) {
          e.preventDefault();
          const text = toOutlineText(nodes);
          void win.navigator.clipboard.writeText(text);
          void removeNodes(selectedIds);
        }
        return;
      }

      // 7. ArrowUp: 선택 해제 후 첫 번째 선택 불릿의 이전 불릿(또는 첫 불릿)으로 포커스
      if (e.key === 'ArrowUp' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        const firstId = selectedIds[0];
        const targetId = getNextFocusId(rows.current, firstId, 'up') ?? firstId;
        clearSelection();
        store.setFocus(targetId, 0);
        return;
      }

      // 8. ArrowDown: 선택 해제 후 마지막 선택 불릿의 다음 불릿(또는 마지막 불릿)으로 포커스
      if (e.key === 'ArrowDown' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        const lastId = selectedIds[selectedIds.length - 1];
        const targetId = getNextFocusId(rows.current, lastId, 'down') ?? lastId;
        clearSelection();
        store.setFocus(targetId, 0);
        return;
      }

      // 9. Ctrl+A: 전체 노드 선택
      if (isModifier && e.key.toLowerCase() === 'a' && !isTyping) {
        e.preventDefault();
        const allIds = rows.current.map((n) => n.id);
        selectNodes(allIds);
        return;
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const active = win.document.activeElement;
      const isTyping =
        active instanceof HTMLElement &&
        (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (isTyping) return;

      const selectedIds = api.getState().selectedNodeIds;
      if (selectedIds.length === 0) return;
      const targetId = selectedIds[selectedIds.length - 1];

      if (e.clipboardData) {
        const files = extractFilesFromClipboard(e.clipboardData);
        if (files.length > 0) {
          e.preventDefault();
          void pasteClipboardFiles(targetId, e.clipboardData);
        }
      }
    };

    win.addEventListener('keydown', handleKeyDown);
    win.addEventListener('paste', handlePaste);
    return () => {
      win.removeEventListener('keydown', handleKeyDown);
      win.removeEventListener('paste', handlePaste);
    };
  }, [hasSelection, clearSelection, removeNodes, selectNodes, store, api, win, pasteClipboardFiles]);

  return { handleMouseDown };
}
