/**
 * @file OutlineMoveDialog.tsx
 * @description "이동" 대화상자 — 옮길 곳(어느 불릿의 하위로, 또는 맨 위 단계로)을 찾아 고른다.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NodeId } from '@vibe/outliner-core';
import { ArrowUpToLine, Search, X } from 'lucide-react';
import { useEditorStore, useEditorWindow, useOutlineHost } from '../session/context';
import { useMoveTargets } from '../model/useMoveTargets';

interface OutlineMoveDialogProps {
  sourceIds: NodeId[];
  onClose: () => void;
}

export const OutlineMoveDialog: React.FC<OutlineMoveDialogProps> = ({ sourceIds, onClose }) => {
  const moveNodes = useEditorStore((s) => s.moveNodes);
  const [query, setQuery] = useState('');
  const [isRejected, setIsRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targets = useMoveTargets(sourceIds, query);
  const host = useOutlineHost();
  const win = useEditorWindow();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    win.addEventListener('keydown', handleKeyDown);
    return () => win.removeEventListener('keydown', handleKeyDown);
  }, [onClose, win]);

  const moveTo = (targetId: NodeId | null) => {
    if (moveNodes(sourceIds, targetId, 'inside')) onClose();
    else setIsRejected(true);
  };

  return createPortal(
    <div
      data-row-control
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="outline-menu-pop w-full max-w-md mx-4 rounded-xl bg-(--background-secondary) border border-(--background-modifier-border) shadow-2xl shadow-black/60 flex flex-col max-h-[70vh]">
        <div className="px-4 py-3 border-b border-(--background-modifier-border) flex items-center justify-between">
          <span className="text-sm font-semibold text-(--text-normal)">
            {sourceIds.length > 1 ? `불릿 ${sourceIds.length}개 이동` : '불릿 이동'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-(--text-muted) hover:text-(--text-normal) hover:bg-(--background-modifier-hover) cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-(--background-modifier-border) flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-(--text-faint) shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="옮길 곳의 불릿을 찾으세요..."
            className="w-full bg-transparent text-sm text-(--text-normal) placeholder:text-(--text-faint) outline-none"
          />
        </div>

        {isRejected && (
          <div className="px-4 py-2 text-[11px] text-amber-300 bg-amber-950/30 border-b border-amber-800/40">
            그곳으로는 옮길 수 없습니다.
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          <button
            type="button"
            onClick={() => moveTo(null)}
            className="w-full px-4 py-2 flex items-center gap-2 text-left text-xs text-(--text-accent) hover:bg-(--background-modifier-hover)/80 cursor-pointer"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
            <span>맨 위 단계로</span>
          </button>

          {targets.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-(--text-faint)">옮길 수 있는 불릿이 없습니다.</p>
          ) : (
            targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => moveTo(target.id)}
                className="w-full px-4 py-1.5 text-left hover:bg-(--background-modifier-hover)/80 cursor-pointer"
                style={{ paddingLeft: `${16 + (query ? 0 : target.depth * 14)}px` }}
              >
                <div className="text-xs text-(--text-normal) truncate">{target.text}</div>
                {query && target.trail && (
                  <div className="text-[10px] text-(--text-faint) truncate">{target.trail}</div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-(--background-modifier-border) text-[10px] text-(--text-faint)">
          고른 불릿의 하위 맨 끝으로 옮겨집니다.
        </div>
      </div>
    </div>,
    host.getPortalRoot()
  );
};
