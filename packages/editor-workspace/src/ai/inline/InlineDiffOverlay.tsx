import { memo, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import type { InlineDiffOverlayProps } from './types';

/**
 * InlineDiffOverlay (에디터 본문 인라인 Diff 오버레이)
 *
 * 안티그래비티 스타일로 변경 전 원문(빨간 취소선)과 제안문(초록 배경)을 에디터 캔버스에 직접 오버레이하고,
 * Ctrl+Enter(수락), Esc(거절) 단축키로 제어합니다.
 */
export const InlineDiffOverlay = memo(function InlineDiffOverlay({
  originalText,
  proposedText,
  onAccept,
  onReject,
  onEdit,
  className = '',
}: InlineDiffOverlayProps) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onAccept, onReject]);

  return (
    <div className={`relative flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900/95 border border-indigo-500/80 shadow-xl backdrop-blur-md text-xs font-sans ${className}`}>
      {/* 1. 변경 대조 텍스트 (원문 취소선 + 제안문 밑줄) */}
      <div className="flex flex-col gap-1 leading-relaxed">
        {originalText && (
          <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 line-through opacity-80">
            {originalText}
          </div>
        )}
        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 font-medium">
          {proposedText}
        </div>
      </div>

      {/* 2. 하단 컨트롤 바 (단축키 힌트 및 버튼) */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
          <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-200">Ctrl</kbd>+<kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-200">Enter</kbd> 수락</span>
          <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-200">Esc</kbd> 취소</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(proposedText)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <Edit2 className="w-2.5 h-2.5" />
              <span>직접 수정</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>거절</span>
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-3 h-3" />
            <span>수락</span>
          </button>
        </div>
      </div>
    </div>
  );
});
