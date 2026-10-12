/**
 * @file OutlineTree.tsx
 * @description 평탄화된 아웃라인 노드들을 렌더링하는 컨테이너 컴포넌트
 * - 노드 메뉴·이동 대화상자·선택 막대는 트리 전체에 하나씩만 두고, 대상에 맞춰 띄운다.
 * - 끌어 놓기와 여러 불릿 선택의 상태도 여기서 한 번만 만들어 모든 행에 내려준다.
 */

import React, { useMemo, useState } from 'react';
import { type NodeId, flattenTree } from '@vibe/outliner-core';
import { useEditorStore, useOutlineRoots } from '../session/context';
import { OutlineRow, type OutlineRowHandlers } from './OutlineRow';
import { OutlineContextMenu } from './OutlineContextMenu';
import { OutlineMoveDialog } from './OutlineMoveDialog';
import { OutlineSelectionBar } from './OutlineSelectionBar';
import { useContextMenu } from '../model/useContextMenu';
import { useDragAndDrop } from '../model/useDragAndDrop';
import { useRowSelection } from '../model/useRowSelection';
import { Plus } from 'lucide-react';

export const OutlineTree: React.FC = () => {
  const rootNodes = useOutlineRoots();
  const activeRootId = useEditorStore((s) => s.activeRootId);
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const addBulletAtEnd = useEditorStore((s) => s.addBulletAtEnd);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  const { menu, menuRef, openMenu, closeMenu, hoverOpen, hoverLeave, hoverStay } =
    useContextMenu();
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

  const handlers = useMemo<OutlineRowHandlers>(
    () => ({
      openMenu,
      hoverOpenMenu: hoverOpen,
      hoverLeaveMenu: hoverLeave,
      startDrag,
      dragOverRow,
      dropOnRow,
      endDrag,
    }),
    [openMenu, hoverOpen, hoverLeave, startDrag, dragOverRow, dropOnRow, endDrag]
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

  return (
    <div className="flex flex-col space-y-0.5 py-2" onMouseDown={handleMouseDown}>
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
          onMouseEnter={hoverStay}
          onMouseLeave={hoverLeave}
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
