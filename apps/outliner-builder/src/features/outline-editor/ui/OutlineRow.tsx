/**
 * @file OutlineRow.tsx
 * @description 들여쓰기 패딩 + 조작부(손잡이·화살표·불릿 점) + 텍스트 인풋 + 참조 뱃지 + 노트를 결합한 아웃라인 한 줄 뷰
 * - 끌어 놓기의 대상이기도 하다: 위에 끌어오면 놓을 자리(파란 선)를 보여준다.
 */

import React from 'react';
import {
  type DropPosition,
  type FlattenedNode,
  type NodeId,
  isFullyExpanded,
} from '@vibe/outliner-core';
import { LayoutGrid } from 'lucide-react';
import { OutlineBullet } from './OutlineBullet';
import { OutlineDropIndicator } from './OutlineDropIndicator';
import { OutlineInput } from './OutlineInput';
import { OutlineNote } from './OutlineNote';
import { useKeyOrchestrator } from '../model/useKeyOrchestrator';
import { useZoom } from '../model/useZoom';
import { ProjectRefBadge, useWorkspaceStore } from '@/entities/workspace';

/** 트리가 모든 행에 똑같이 내려주는 조작 함수 묶음 */
export interface OutlineRowHandlers {
  openMenu: (nodeId: NodeId, x: number, y: number) => void;
  hoverOpenMenu: (nodeId: NodeId, x: number, y: number) => void;
  hoverLeaveMenu: () => void;
  startDrag: (e: React.DragEvent<HTMLElement>, item: FlattenedNode) => void;
  dragOverRow: (e: React.DragEvent<HTMLElement>, item: FlattenedNode) => void;
  dropOnRow: (e: React.DragEvent<HTMLElement>) => void;
  endDrag: () => void;
}

interface OutlineRowProps {
  item: FlattenedNode;
  /** 키보드로 오갈 수 있는 행 목록 (구분선처럼 글자가 없는 행은 빠져 있다) */
  navigableNodes: FlattenedNode[];
  isSelected: boolean;
  isDragging: boolean;
  dropPosition: DropPosition | null;
  handlers: OutlineRowHandlers;
}

export const OutlineRow: React.FC<OutlineRowProps> = ({
  item,
  navigableNodes,
  isSelected,
  isDragging,
  dropPosition,
  handlers,
}) => {
  const toggleFold = useWorkspaceStore((s) => s.toggleFold);
  const setFoldDeep = useWorkspaceStore((s) => s.setFoldDeep);
  const toggleCompleted = useWorkspaceStore((s) => s.toggleCompleted);
  const isNoteEditing = useWorkspaceStore((s) => s.noteEditingNodeId === item.id);
  const { zoomIn } = useZoom();
  const { handleKeyDown } = useKeyOrchestrator(item.id, navigableNodes);

  const { node } = item;
  const nodeType = node.nodeType ?? 'bullet';
  const isCompleted = node.isCompleted === true;
  const isDivider = nodeType === 'divider';
  const hasNote = !isDivider && (Boolean(node.note) || isNoteEditing);

  return (
    <div
      className={`group/row flex items-start py-0.5 relative rounded transition-colors ${
        isSelected ? 'bg-(--interactive-accent)/15' : 'hover:bg-(--background-modifier-hover)'
      } ${isDragging ? 'opacity-40 bg-(--background-modifier-hover)' : ''}`}
      style={{ paddingLeft: `${item.depth * 24}px` }}
      data-node-id={item.id}
      data-row-id={item.id}
      onDragOver={(e) => handlers.dragOverRow(e, item)}
      onDrop={handlers.dropOnRow}
    >
      {/* 0. 끌어 놓을 자리 표시 */}
      {dropPosition && <OutlineDropIndicator position={dropPosition} depth={item.depth} />}

      {/* 1. 들여쓰기 세로 가이드선 (depth > 0) */}
      {item.depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-(--background-modifier-border) pointer-events-none group-hover/row:bg-(--background-modifier-border-hover)"
          style={{ left: `${(item.depth - 1) * 24 + 46}px` }}
        />
      )}

      {/* 2. 손잡이 · 화살표 · 불릿 점 */}
      <div className="pt-1.5">
        <OutlineBullet
          hasChildren={item.hasChildren}
          isFolded={item.isFolded}
          isCompleted={isCompleted}
          isTodo={nodeType === 'todo'}
          isDotSubtle={nodeType === 'paragraph'}
          onToggleFold={() => toggleFold(item.id)}
          onToggleFoldDeep={() => setFoldDeep(item.id, isFullyExpanded(node))}
          onZoom={() => zoomIn(item.id)}
          onOpenMenu={(x, y) => handlers.openMenu(item.id, x, y)}
          onHandleEnter={(x, y) => handlers.hoverOpenMenu(item.id, x, y)}
          onHandleLeave={handlers.hoverLeaveMenu}
          onToggleCompleted={() => toggleCompleted(item.id)}
          onDragStart={(e) => handlers.startDrag(e, item)}
          onDragEnd={handlers.endDrag}
        />
      </div>

      {/* 3. 텍스트 입력 에디터 & 참조 뱃지, 그 아래 부연설명 노트 */}
      <div className="flex-1 min-w-0" data-row-text>
        {isDivider ? (
          <div className="h-[26px] flex items-center px-1.5">
            <hr className="w-full border-0 border-t border-slate-700" />
          </div>
        ) : (
          <div className="flex items-center min-w-0 flex-wrap">
            <OutlineInput
              nodeId={item.id}
              initialText={node.text}
              nodeType={nodeType}
              isCompleted={isCompleted}
              isProjectRef={node.ref?.type === 'project'}
              onKeyDown={handleKeyDown}
            />

            {/* 줌인하면 보드로 보이는 불릿 표시 */}
            {node.viewMode === 'board' && (
              <span
                className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 select-none"
                title="줌인하면 보드로 표시됩니다"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>보드</span>
              </span>
            )}

            {/* 프로젝트 참조 뱃지 */}
            {node.ref && node.ref.type === 'project' && (
              <ProjectRefBadge
                targetProjectId={node.ref.targetProjectId}
                displayText={node.ref.displayText}
                relation={node.ref.relation}
              />
            )}
          </div>
        )}

        {hasNote && (
          <OutlineNote nodeId={item.id} note={node.note ?? ''} flattenedNodes={navigableNodes} />
        )}
      </div>
    </div>
  );
};
