/**
 * @file OutlineBullet.tsx
 * @description 아웃라인 한 줄의 왼쪽 조작부: "⋯" 손잡이, 접기 화살표, 불릿 점, (할 일이면) 체크박스
 * - 손잡이: 행에 마우스가 올라오면 보이고, 올리거나 누르면 노드 메뉴가 열린다.
 * - 화살표: 클릭은 한 단계 접기/펼치기, 더블클릭은 하위 전체 접기/펼치기
 * - 불릿 점: 호버 링, 좌클릭 줌인, 우클릭 노드 메뉴, 잡고 끌면 이동 (Alt 를 누른 채 놓으면 복제)
 */

import React from 'react';
import { Check, ChevronRight, MoreHorizontal } from 'lucide-react';

interface OutlineBulletProps {
  hasChildren: boolean;
  isFolded: boolean;
  isCompleted?: boolean;
  isTodo?: boolean;
  /** 평소에는 불릿 점을 숨기는 종류(문단)인지 */
  isDotSubtle?: boolean;
  onToggleFold: () => void;
  onToggleFoldDeep: () => void;
  onZoom: () => void;
  onOpenMenu: (x: number, y: number) => void;
  onHandleEnter: (x: number, y: number) => void;
  onHandleLeave: () => void;
  onToggleCompleted: () => void;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export const OutlineBullet: React.FC<OutlineBulletProps> = ({
  hasChildren,
  isFolded,
  isCompleted = false,
  isTodo = false,
  isDotSubtle = false,
  onToggleFold,
  onToggleFoldDeep,
  onZoom,
  onOpenMenu,
  onHandleEnter,
  onHandleLeave,
  onToggleCompleted,
  onDragStart,
  onDragEnd,
}) => {
  const menuAnchor = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.bottom + 2 };
  };

  return (
    <div data-row-control className="flex items-center gap-0.5 shrink-0 select-none">
      {/* 1. 노드 메뉴 손잡이 */}
      <button
        type="button"
        tabIndex={-1}
        onMouseEnter={(e) => {
          const { x, y } = menuAnchor(e.currentTarget);
          onHandleEnter(x, y);
        }}
        onMouseLeave={onHandleLeave}
        onClick={(e) => {
          e.stopPropagation();
          const { x, y } = menuAnchor(e.currentTarget);
          onOpenMenu(x, y);
        }}
        className="w-4 h-4 flex items-center justify-center rounded text-(--text-faint) hover:text-(--text-normal) hover:bg-(--background-modifier-hover)/80 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 cursor-pointer"
        title="메뉴"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {/* 2. 접기/펼치기 화살표 (자식이 없으면 자리만 차지) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFold();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onToggleFoldDeep();
        }}
        className={`w-4 h-4 flex items-center justify-center rounded text-(--text-muted) hover:text-(--text-normal) hover:bg-(--background-modifier-hover)/80 transition-[opacity,rotate,color] duration-200 cursor-pointer opacity-0 ${
          hasChildren ? 'group-hover/row:opacity-100' : 'pointer-events-none'
        } ${isFolded ? 'rotate-0' : 'rotate-90'}`}
        title={
          isFolded
            ? '펼치기 (더블클릭: 하위 전체 펼치기)'
            : '접기 (더블클릭: 하위 전체 접기)'
        }
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 3. 불릿 점 */}
      <button
        type="button"
        tabIndex={-1}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onZoom();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenMenu(e.clientX, e.clientY);
        }}
        className="w-5 h-5 flex items-center justify-center rounded-full ring-0 ring-(--interactive-accent)/0 hover:bg-(--background-modifier-hover) hover:ring-4 hover:ring-(--interactive-accent)/40 transition-all duration-150 cursor-grab active:cursor-grabbing group/dot"
        title="클릭: 줌인 · 끌기: 이동 (Alt: 복제) · 우클릭: 메뉴"
      >
        <span
          className={`rounded-full transition-all duration-150 ${isCompleted ? 'opacity-50' : ''} ${
            isDotSubtle && !hasChildren ? 'opacity-0 group-hover/row:opacity-100' : ''
          } ${
            hasChildren && isFolded
              ? 'w-3 h-3 bg-(--interactive-accent) ring-2 ring-(--interactive-accent)/30'
              : hasChildren
              ? 'w-2.5 h-2.5 bg-(--text-muted) ring-1 ring-(--background-modifier-border-hover) group-hover/dot:bg-(--interactive-accent)'
              : 'w-1.5 h-1.5 bg-(--text-faint) group-hover/dot:bg-(--interactive-accent)'
          }`}
        />
      </button>

      {/* 4. 할 일 체크박스 */}
      {isTodo && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompleted();
          }}
          className={`w-4 h-4 mx-0.5 flex items-center justify-center rounded border transition-colors cursor-pointer ${
            isCompleted
              ? 'bg-emerald-600/80 border-emerald-500 text-(--text-on-accent)'
              : 'border-(--background-modifier-border-hover) hover:border-(--interactive-accent) text-transparent'
          }`}
          title={isCompleted ? '완료 취소' : '완료 처리'}
        >
          <Check className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
