import { memo, useState } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import type { CitationBadgeProps } from './types';

/**
 * CitationBadge (원천 인용 배지)
 *
 * 생성된 텍스트의 근거가 된 원본 리소스 인용 번호([1], [2]).
 * 호버 시 발췌문 툴팁을 띄우고, 클릭 시 원본 문서 뷰어의 해당 위치로 점프합니다.
 */
export const CitationBadge = memo(function CitationBadge({
  citation,
  onClick,
  className = '',
}: CitationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className={`relative inline-block align-super mx-0.5 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(citation);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="px-1 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 transition-colors select-none cursor-pointer shadow-2xs"
        title={`출처: ${citation.sourceDocTitle}${citation.page ? ` (p.${citation.page})` : ''}`}
      >
        [{citation.index}]
      </button>

      {/* 호버 툴팁 */}
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-64 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xl z-50 text-left pointer-events-none">
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-indigo-700 font-bold mb-1 pb-1 border-b border-slate-100">
            <span className="truncate flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5" />
              {citation.sourceDocTitle}
            </span>
            {citation.page !== undefined && <span className="shrink-0 text-slate-500">p.{citation.page}</span>}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed font-sans">
            "{citation.snippet}"
          </p>
          <div className="mt-1 text-[9px] text-indigo-600 font-medium flex items-center gap-0.5">
            <ExternalLink className="w-2 h-2" />
            <span>클릭하여 원문 뷰어로 이동</span>
          </div>
        </div>
      )}
    </span>
  );
});
