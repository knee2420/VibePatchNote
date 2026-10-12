/**
 * @file OutlineMoveDialog.tsx
 * @description "이동" 대화상자 — 옮길 곳(어느 불릿의 하위로, 또는 맨 위 단계로)을 찾아 고른다.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NodeId } from '@vibe/outliner-core';
import { ArrowUpToLine, Search, X } from 'lucide-react';
import { useWorkspaceStore } from '@/entities/workspace';
import { useMoveTargets } from '../model/useMoveTargets';

interface OutlineMoveDialogProps {
  sourceIds: NodeId[];
  onClose: () => void;
}

export const OutlineMoveDialog: React.FC<OutlineMoveDialogProps> = ({ sourceIds, onClose }) => {
  const moveNodes = useWorkspaceStore((s) => s.moveNodes);
  const [query, setQuery] = useState('');
  const [isRejected, setIsRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targets = useMoveTargets(sourceIds, query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      <div className="outline-menu-pop w-full max-w-md mx-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 flex flex-col max-h-[70vh]">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">
            {sourceIds.length > 1 ? `불릿 ${sourceIds.length}개 이동` : '불릿 이동'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="옮길 곳의 불릿을 찾으세요..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-600 outline-none"
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
            className="w-full px-4 py-2 flex items-center gap-2 text-left text-xs text-indigo-300 hover:bg-slate-800/80 cursor-pointer"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
            <span>맨 위 단계로</span>
          </button>

          {targets.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-500">옮길 수 있는 불릿이 없습니다.</p>
          ) : (
            targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => moveTo(target.id)}
                className="w-full px-4 py-1.5 text-left hover:bg-slate-800/80 cursor-pointer"
                style={{ paddingLeft: `${16 + (query ? 0 : target.depth * 14)}px` }}
              >
                <div className="text-xs text-slate-200 truncate">{target.text}</div>
                {query && target.trail && (
                  <div className="text-[10px] text-slate-500 truncate">{target.trail}</div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500">
          고른 불릿의 하위 맨 끝으로 옮겨집니다.
        </div>
      </div>
    </div>,
    document.body
  );
};
