import { memo } from 'react';
import type { InlineDiffViewerProps } from './types';

/**
 * InlineDiffViewer (인라인 및 분할 Diff 대조기)
 *
 * 기존 원문 vs AI 제안 텍스트를 나란히(Split) 또는 인라인(Unified)으로 비교.
 */
export const InlineDiffViewer = memo(function InlineDiffViewer({
  originalText,
  proposedText,
  mode = 'unified',
  className = '',
}: InlineDiffViewerProps) {
  if (mode === 'split') {
    return (
      <div className={`grid grid-cols-2 gap-2 text-xs font-mono rounded-lg overflow-hidden border border-slate-800 ${className}`}>
        {/* 원본 (좌) */}
        <div className="p-2.5 bg-rose-950/20 text-rose-200/80 border-r border-slate-800">
          <div className="text-[10px] font-bold uppercase text-rose-400 mb-1">Original</div>
          <div className="whitespace-pre-wrap leading-relaxed opacity-90">{originalText || '(빈 내용)'}</div>
        </div>

        {/* 제안 (우) */}
        <div className="p-2.5 bg-emerald-950/20 text-emerald-200/90">
          <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1">Proposed (AI)</div>
          <div className="whitespace-pre-wrap leading-relaxed">{proposedText}</div>
        </div>
      </div>
    );
  }

  // Unified 모드: 원문 취소선 + 제안 초록 밑줄
  return (
    <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans leading-relaxed ${className}`}>
      {originalText && (
        <div className="p-2 mb-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 line-through opacity-80">
          {originalText}
        </div>
      )}
      <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 font-medium">
        {proposedText}
      </div>
    </div>
  );
});
