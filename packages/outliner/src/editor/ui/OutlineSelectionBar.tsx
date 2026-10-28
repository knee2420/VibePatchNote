/**
 * @file OutlineSelectionBar.tsx
 * @description 여러 불릿을 골랐을 때 화면 아래에 뜨는 묶음 조작 막대
 */

import React, { useState } from 'react';
import type { NodeId } from '../../core';
import { CheckCircle2, Copy, MoveRight, Shapes, Trash2, X } from 'lucide-react';
import { TURN_INTO_OPTIONS, useNodeActions } from '../model/useNodeActions';

interface OutlineSelectionBarProps {
  selectedIds: NodeId[];
  onRequestMove: (nodeIds: NodeId[]) => void;
  onClear: () => void;
}

const buttonClass =
  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-(--text-normal) hover:bg-(--background-modifier-hover) hover:text-(--text-normal) transition-colors cursor-pointer';

export const OutlineSelectionBar: React.FC<OutlineSelectionBarProps> = ({
  selectedIds,
  onRequestMove,
  onClear,
}) => {
  const actions = useNodeActions();
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);

  return (
    <div
      data-row-control
      className="outline-menu-pop fixed bottom-14 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-1 px-2 py-1.5 rounded-xl bg-(--background-secondary)/95 border border-(--background-modifier-border-hover) backdrop-blur-md shadow-2xl shadow-black/60 select-none"
    >
      <span className="px-2 text-xs font-semibold text-(--text-accent) whitespace-nowrap">
        {selectedIds.length}개 선택
      </span>
      <div className="w-px h-4 bg-(--background-modifier-border-hover)" />

      <button
        type="button"
        className={buttonClass}
        onClick={() => actions.setNodesCompleted(selectedIds)}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>완료</span>
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => actions.duplicateNodes(selectedIds)}
      >
        <Copy className="w-3.5 h-3.5 text-(--text-muted)" />
        <span>복제</span>
      </button>
      <button type="button" className={buttonClass} onClick={() => onRequestMove(selectedIds)}>
        <MoveRight className="w-3.5 h-3.5 text-(--text-muted)" />
        <span>이동</span>
      </button>

      <div className="relative">
        <button
          type="button"
          className={buttonClass}
          onClick={() => setIsTypeListOpen((open) => !open)}
        >
          <Shapes className="w-3.5 h-3.5 text-violet-400" />
          <span>종류</span>
        </button>
        {isTypeListOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-44 p-1 grid grid-cols-2 gap-0.5 rounded-lg bg-(--background-secondary) border border-(--background-modifier-border-hover) shadow-2xl shadow-black/60">
            {TURN_INTO_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  actions.turnInto(selectedIds, option.value);
                  setIsTypeListOpen(false);
                }}
                className="px-2 py-1 rounded text-left text-[11px] text-(--text-muted) hover:bg-(--background-modifier-hover) hover:text-(--text-normal) cursor-pointer"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
        onClick={() => actions.removeNodes(selectedIds)}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>삭제</span>
      </button>

      <div className="w-px h-4 bg-(--background-modifier-border-hover)" />
      <button
        type="button"
        onClick={onClear}
        className="p-1.5 rounded-md text-(--text-muted) hover:text-(--text-normal) hover:bg-(--background-modifier-hover) cursor-pointer"
        title="선택 해제 (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
