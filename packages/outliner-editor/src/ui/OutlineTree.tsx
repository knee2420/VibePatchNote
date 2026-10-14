/**
 * @file OutlineTree.tsx
 * @description 평탄화된 아웃라인 노드들을 렌더링하는 컨테이너 컴포넌트
 * - 노드 메뉴·이동 대화상자·선택 막대는 트리 전체에 하나씩만 두고, 대상에 맞춰 띄운다.
 * - 끌어 놓기와 여러 불릿 선택의 상태도 여기서 한 번만 만들어 모든 행에 내려준다.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { type NodeId, flattenTree } from '@vibe/outliner-core';
import { useEditorStore, useEditorWindow, useOutlineRoots } from '../session/context';
import { OutlineRow, type OutlineRowHandlers } from './OutlineRow';
import { OutlineContextMenu } from './OutlineContextMenu';
import { OutlineMoveDialog } from './OutlineMoveDialog';
import { OutlineSelectionBar } from './OutlineSelectionBar';
import { useContextMenu } from '../model/useContextMenu';
import { useDragAndDrop } from '../model/useDragAndDrop';
import { useRowSelection } from '../model/useRowSelection';
import { getCaretCharacterOffsetWithin } from '../model/useKeyOrchestrator';
import { useFileAttach } from '../attachments/useFileAttach';
import { Plus } from 'lucide-react';

export const OutlineTree: React.FC = () => {
  const rootNodes = useOutlineRoots();
  const activeRootId = useEditorStore((s) => s.activeRootId);
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const addBulletAtEnd = useEditorStore((s) => s.addBulletAtEnd);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const store = useEditorStore((s) => s);
  const win = useEditorWindow();

  const { canAttach, isDraggingFile, dropOnTree } = useFileAttach();
  const { menu, menuRef, openMenu, closeMenu } = useContextMenu();
  const { dragIds, dropTarget, startDrag, dragOverRow, dropOnRow, endDrag } = useDragAndDrop();
  const [moveSourceIds, setMoveSourceIds] = useState<NodeId[] | null>(null);

  // 줌인 상태에 맞춘 평탄화 노드 목록 계산
  const flattenedNodes = useMemo(() => {
    return flattenTree(rootNodes, activeRootId);
  }, [rootNodes, activeRootId]);

  // 구분선에는 글자 입력 칸이 없으므로, 키보드로 오갈 때는 건너뛴다.
  const navigableNodes = useMemo(
    () => flattenedNodes.filter((n) => n.node.nodeType !== 'divider'),
    [flattenedNodes]
  );

  const { handleMouseDown } = useRowSelection(flattenedNodes);

  // 단일 불릿 편집 중에도 옵시디언 전역 핫키 가로채기보다 먼저 발동하도록 capture 모드 사용
  useEffect(() => {
    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      // 다중 선택 상태는 useRowSelection 에서 별도로 처리
      if (store.selectedNodeIds.length > 0) return;

      const active = win.document.activeElement;
      if (!(active instanceof HTMLElement)) return;

      const rowEl = active.closest<HTMLElement>('[data-node-id]');
      if (!rowEl) return;

      const nodeId = rowEl.dataset.nodeId;
      if (!nodeId) return;

      const isModifier = e.ctrlKey || e.metaKey;

      // 1. Ctrl+Enter: 완료/미완료 토글
      if (e.key === 'Enter' && isModifier && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        store.toggleCompleted(nodeId);
        return;
      }

      // 2. Alt+ArrowUp / Alt+ArrowDown: 불릿 순서 이동
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const caretPos = getCaretCharacterOffsetWithin(active);
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';
        store.setFocus(nodeId, caretPos);
        const moved = store.moveNodesStep([nodeId], direction);
        if (moved) {
          win.requestAnimationFrame(() => {
            active.focus();
            store.setFocus(nodeId, caretPos);
          });
        }
        return;
      }
    };

    win.addEventListener('keydown', handleCaptureKeyDown, true);
    return () => win.removeEventListener('keydown', handleCaptureKeyDown, true);
  }, [win, store]);

  const handlers = useMemo<OutlineRowHandlers>(
    () => ({
      openMenu,
      startDrag,
      dragOverRow,
      dropOnRow,
      endDrag,
    }),
    [openMenu, startDrag, dragOverRow, dropOnRow, endDrag]
  );

  const selectedSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const draggingSet = useMemo(() => new Set(dragIds ?? []), [dragIds]);

  // 메뉴가 열린 사이 대상 불릿이 사라졌다면(삭제·추출) 메뉴도 띄우지 않는다.
  const menuItem = menu ? flattenedNodes.find((n) => n.id === menu.nodeId) : undefined;
  // 여러 개를 골라 둔 상태에서 그중 하나의 메뉴를 열면 묶음 전체가 대상이다.
  const menuTargetIds = menuItem
    ? selectedSet.has(menuItem.id)
      ? selectedNodeIds
      : [menuItem.id]
    : [];

  // 트리 빈 영역에 파일을 끌어다 놓으면 맨 아래 새 불릿으로 생성/첨부한다.
  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (canAttach && isDraggingFile(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (canAttach && isDraggingFile(e)) {
      e.preventDefault();
      void dropOnTree(e);
    }
  };

  return (
    // 줄 사이 간격은 여기 한 곳에서 정한다. 옵시디언의 목록 간격 변수를 따르고, 없으면(독립 앱) 같은 기본값을 쓴다.
    // 각 줄은 글자 한 줄의 높이에 이 간격을 위아래로 더한 만큼만 차지한다.
    <div
      data-outline-tree
      className="flex flex-col py-2 [--outline-line-gap:var(--list-spacing,0.075em)]"
      onMouseDown={handleMouseDown}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
    >
      {flattenedNodes.length === 0 && (
        <p className="py-8 text-center text-(--text-faint) text-sm">아웃라인 항목이 비어있습니다.</p>
      )}

      {flattenedNodes.map((item) => (
        <OutlineRow
          key={item.id}
          item={item}
          navigableNodes={navigableNodes}
          isSelected={selectedSet.has(item.id)}
          isDragging={item.path.some((id) => draggingSet.has(id))}
          dropPosition={dropTarget?.targetId === item.id ? dropTarget.position : null}
          handlers={handlers}
        />
      ))}

      {/* 목록 맨 아래: 새 불릿 추가 */}
      <button
        type="button"
        data-row-control
        onClick={() => addBulletAtEnd()}
        className="self-start mt-1 ml-9 w-6 h-6 flex items-center justify-center rounded-full text-(--text-faint) hover:text-(--text-normal) hover:bg-(--background-modifier-hover) transition-colors cursor-pointer"
        title="새 불릿 추가"
      >
        <Plus className="w-4 h-4" />
      </button>

      {menu && menuItem && (
        <OutlineContextMenu
          item={menuItem}
          targetIds={menuTargetIds}
          x={menu.x}
          y={menu.y}
          menuRef={menuRef}
          onClose={closeMenu}
          onRequestMove={setMoveSourceIds}
        />
      )}

      {moveSourceIds && (
        <OutlineMoveDialog sourceIds={moveSourceIds} onClose={() => setMoveSourceIds(null)} />
      )}

      {selectedNodeIds.length > 0 && (
        <OutlineSelectionBar
          selectedIds={selectedNodeIds}
          onRequestMove={setMoveSourceIds}
          onClear={clearSelection}
        />
      )}
    </div>
  );
};
