/**
 * @file useBoardDragAndDrop.ts
 * @description 보드에서 카드와 컬럼을 끌어 옮기는 드래그 앤 드롭 계산 훅 (HTML5 Drag and Drop)
 *
 * - 카드: 다른 카드의 위/아래, 또는 컬럼의 빈 곳(그 컬럼 맨 끝)에 놓는다. 컬럼 사이 이동도 같다.
 * - 컬럼: 다른 컬럼의 왼쪽/오른쪽에 놓는다.
 * 보드의 카드·컬럼은 결국 불릿이므로, 옮기는 일은 불릿 이동과 같은 창구를 쓴다.
 */

import { type DragEvent, useCallback, useState } from 'react';
import type { DropPosition, NodeId } from '../../core';
import { useEditorStore } from '../session/context';

export type BoardDragKind = 'card' | 'column';

export interface BoardDropTarget {
  targetId: NodeId;
  position: DropPosition;
}

export interface BoardDnd {
  dragging: { kind: BoardDragKind; id: NodeId } | null;
  dropTarget: BoardDropTarget | null;
  startDrag: (e: DragEvent<HTMLElement>, kind: BoardDragKind, id: NodeId) => void;
  overCard: (e: DragEvent<HTMLElement>, cardId: NodeId) => void;
  overColumnBody: (e: DragEvent<HTMLElement>, columnId: NodeId) => void;
  overColumn: (e: DragEvent<HTMLElement>, columnId: NodeId) => void;
  drop: (e: DragEvent<HTMLElement>) => void;
  endDrag: () => void;
}

export function useBoardDragAndDrop(): BoardDnd {
  const moveNodes = useEditorStore((s) => s.moveNodes);
  const [dragging, setDragging] = useState<BoardDnd['dragging']>(null);
  const [dropTarget, setDropTarget] = useState<BoardDropTarget | null>(null);

  const endDrag = useCallback(() => {
    setDragging(null);
    setDropTarget(null);
  }, []);

  const aim = useCallback((targetId: NodeId, position: DropPosition) => {
    setDropTarget((current) =>
      current?.targetId === targetId && current.position === position
        ? current
        : { targetId, position }
    );
  }, []);

  const startDrag = useCallback(
    (e: DragEvent<HTMLElement>, kind: BoardDragKind, id: NodeId) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      const box = e.currentTarget.closest(kind === 'card' ? '[data-board-card]' : '[data-board-column]');
      if (box) e.dataTransfer.setDragImage(box, 20, 16);
      setDragging({ kind, id });
    },
    []
  );

  const overCard = useCallback(
    (e: DragEvent<HTMLElement>, cardId: NodeId) => {
      if (dragging?.kind !== 'card' || dragging.id === cardId) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      aim(cardId, e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
    },
    [dragging, aim]
  );

  const overColumnBody = useCallback(
    (e: DragEvent<HTMLElement>, columnId: NodeId) => {
      if (dragging?.kind !== 'card') return;
      e.preventDefault();
      e.stopPropagation();
      aim(columnId, 'inside');
    },
    [dragging, aim]
  );

  const overColumn = useCallback(
    (e: DragEvent<HTMLElement>, columnId: NodeId) => {
      if (dragging?.kind !== 'column' || dragging.id === columnId) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      aim(columnId, e.clientX < rect.left + rect.width / 2 ? 'before' : 'after');
    },
    [dragging, aim]
  );

  const drop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragging && dropTarget) {
        moveNodes([dragging.id], dropTarget.targetId, dropTarget.position);
      }
      endDrag();
    },
    [dragging, dropTarget, moveNodes, endDrag]
  );

  return { dragging, dropTarget, startDrag, overCard, overColumnBody, overColumn, drop, endDrag };
}
