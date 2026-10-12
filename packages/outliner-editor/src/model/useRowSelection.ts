/**
 * @file useRowSelection.ts
 * @description 마우스로 여러 불릿을 끌어 고르는 선택 훅
 *
 * 한 줄 안에서 끌면 평소처럼 글자가 선택되고, 다른 줄로 넘어가는 순간부터 "불릿 단위 선택"으로 바뀐다.
 * Shift+클릭은 마지막으로 누른 줄부터 그 줄까지를 고른다.
 * 고른 상태에서 Esc 는 선택 해제, Delete/Backspace 는 묶음 삭제.
 */

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from 'react';
import type { FlattenedNode, NodeId } from '@vibe/outliner-core';
import { useEditorApi, useEditorStore, useEditorWindow } from '../session/context';
import { useNodeActions } from './useNodeActions';

function rowIdOf(element: Element | null): NodeId | null {
  return element?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId ?? null;
}

export function useRowSelection(flattenedNodes: FlattenedNode[]) {
  const selectNodes = useEditorStore((s) => s.selectNodes);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const hasSelection = useEditorStore((s) => s.selectedNodeIds.length > 0);
  const { removeNodes } = useNodeActions();
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

      clearSelection();
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
    [clearSelection, selectRange, win]
  );

  // 고른 상태에서만: Esc 로 해제, Delete/Backspace 로 묶음 삭제
  useEffect(() => {
    if (!hasSelection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = win.document.activeElement;
      const isTyping =
        active instanceof HTMLElement &&
        (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        clearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
        e.preventDefault();
        void removeNodes(api.getState().selectedNodeIds);
      }
    };

    win.addEventListener('keydown', handleKeyDown);
    return () => win.removeEventListener('keydown', handleKeyDown);
  }, [hasSelection, clearSelection, removeNodes, api, win]);

  return { handleMouseDown };
}
