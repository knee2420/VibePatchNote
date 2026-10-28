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
      <div className={`grid grid-cols-2 gap-2 text-xs font-mono rounded-xl overflow-hidden border border-slate-200 shadow-2xs ${className}`}>
        {/* 원본 (좌) */}
        <div className="p-2.5 bg-rose-50/70 text-rose-900 border-r border-slate-200">
          <div className="text-[10px] font-bold uppercase text-rose-600 mb-1">Original</div>
          <div className="whitespace-pre-wrap leading-relaxed opacity-90">{originalText || '(빈 내용)'}</div>
        </div>

        {/* 제안 (우) */}
        <div className="p-2.5 bg-emerald-50/70 text-emerald-900">
          <div className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Proposed (AI)</div>
          <div className="whitespace-pre-wrap leading-relaxed font-semibold">{proposedText}</div>
        </div>
      </div>
    );
  }

  // Unified 모드: 원문 취소선 + 제안 초록 밑줄
  return (
    <div className={`p-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-sans leading-relaxed shadow-2xs ${className}`}>
      {originalText && (
        <div className="p-2 mb-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 line-through">
          {originalText}
        </div>
      )}
      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
        {proposedText}
      </div>
    </div>
  );
});
