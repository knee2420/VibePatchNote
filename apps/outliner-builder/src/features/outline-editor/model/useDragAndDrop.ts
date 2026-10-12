/**
 * @file useDragAndDrop.ts
 * @description 불릿을 잡고 끌어 순서·계층을 바꾸는 드래그 앤 드롭 계산 훅 (HTML5 Drag and Drop)
 *
 * 놓을 자리는 마우스 위치로 정한다.
 * - 행의 위쪽 30%            : 그 불릿 바로 위
 * - 그 아래, 글자 시작점 근처 : 그 불릿 바로 아래
 * - 그 아래, 오른쪽으로 한 칸 : 그 불릿의 하위 (들여쓰기)
 * - 펼쳐진 부모의 아래쪽      : 그 부모의 첫 번째 하위
 * Alt 를 누른 채 놓으면 옮기지 않고 복제한다.
 */

import { type DragEvent, useCallback, useState } from 'react';
import type { DropPosition, FlattenedNode, NodeId } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

export interface DropTarget {
  targetId: NodeId;
  position: DropPosition;
}

/** 글자 시작점에서 이만큼 오른쪽으로 끌면 "하위로 넣기"로 본다. */
const INDENT_TRIGGER_PX = 24;
const BEFORE_ZONE_RATIO = 0.3;

export function useDragAndDrop() {
  const moveNodes = useWorkspaceStore((s) => s.moveNodes);
  const duplicateNodesTo = useWorkspaceStore((s) => s.duplicateNodesTo);

  const [dragIds, setDragIds] = useState<NodeId[] | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const reset = useCallback(() => {
    setDragIds(null);
    setDropTarget(null);
  }, []);

  // 여러 개를 골라 둔 상태에서 그중 하나를 잡으면 묶음 전체를 끈다.
  const startDrag = useCallback((e: DragEvent<HTMLElement>, item: FlattenedNode) => {
    const { selectedNodeIds } = useWorkspaceStore.getState();
    const ids = selectedNodeIds.includes(item.id) ? selectedNodeIds : [item.id];

    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', item.node.text);
    const row = e.currentTarget.closest('[data-row-id]');
    if (row) e.dataTransfer.setDragImage(row, 40, 14);
    setDragIds(ids);
  }, []);

  const dragOverRow = useCallback(
    (e: DragEvent<HTMLElement>, item: FlattenedNode) => {
      if (!dragIds) return;

      // 끌고 있는 불릿 자신이나 그 하위 위에는 놓을 수 없다.
      if (item.path.some((id) => dragIds.includes(id))) {
        setDropTarget(null);
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';

      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;

      let position: DropPosition;
      if (ratio < BEFORE_ZONE_RATIO) {
        position = 'before';
      } else if (item.hasChildren && !item.isFolded) {
        position = 'inside-start';
      } else {
        const text = e.currentTarget.querySelector('[data-row-text]');
        const textLeft = text ? text.getBoundingClientRect().left : rect.left;
        position = e.clientX > textLeft + INDENT_TRIGGER_PX ? 'inside' : 'after';
      }

      setDropTarget((current) =>
        current?.targetId === item.id && current.position === position
          ? current
          : { targetId: item.id, position }
      );
    },
    [dragIds]
  );

  const dropOnRow = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (dragIds && dropTarget) {
        if (e.altKey) duplicateNodesTo(dragIds, dropTarget.targetId, dropTarget.position);
        else moveNodes(dragIds, dropTarget.targetId, dropTarget.position);
      }
      reset();
    },
    [dragIds, dropTarget, duplicateNodesTo, moveNodes, reset]
  );

  return { dragIds, dropTarget, startDrag, dragOverRow, dropOnRow, endDrag: reset };
}
