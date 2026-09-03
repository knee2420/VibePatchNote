import { memo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface NodeSpreadAnchorProps {
  isSpread: boolean;
  pageCount: number;
  selected?: boolean;
  onToggle: () => void;
}

/**
 * NodeSpreadAnchor
 * 
 * 특정 노드의 뷰포트나 z-index 경합에 갇히지 않고 노드 우측 가장자리에 고정 결합되는 독립 인터랙션 앵커.
 * 페이지 수가 2장 이상일 때만 노출되며, 호버/선택 상태에 맞춰 입체적으로 반응합니다.
 */
export const NodeSpreadAnchor = memo(function NodeSpreadAnchor({
  isSpread,
  pageCount,
  selected = false,
  onToggle,
}: NodeSpreadAnchorProps) {
  // 2페이지 이상일 때만 발동 (1페이지 이하는 펼칠 필요 없음)
  if (!pageCount || pageCount < 2) {
    return null;
  }

  return (
    <div
      className={`
        absolute right-0 translate-x-full top-1/2 -translate-y-1/2 z-50 nodrag nopan
        flex items-center select-none pointer-events-auto
        transition-all duration-200 ease-out
        ${selected ? 'scale-105 opacity-100' : 'opacity-85 group-hover/node:opacity-100'}
      `}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          group/anchor relative flex items-center justify-center
          w-8 h-14 rounded-r-xl border-2 border-l-0 shadow-lg cursor-pointer
          transition-all duration-200 -ml-[2px]
          ${
            isSpread
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700 hover:w-9'
              : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/80 hover:w-9'
          }
        `}
        title={
          isSpread
            ? `세로 기본 모드로 접기 (총 ${pageCount}p)`
            : `전체 ${pageCount}페이지 가로로 펼치기 (Unfold Spread)`
        }
      >
        {/* Toggle Icon */}
        {isSpread ? (
          <ChevronLeft className="w-4 h-4 transition-transform group-hover/anchor:-translate-x-0.5" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform group-hover/anchor:translate-x-0.5" />
        )}

        {/* Hover Badge Pill showing Page Count */}
        <span
          className={`
            absolute left-full ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap
            pointer-events-none transition-all duration-150 shadow-md
            opacity-0 scale-95 group-hover/anchor:opacity-100 group-hover/anchor:scale-100
            ${
              isSpread
                ? 'bg-slate-900 text-white'
                : 'bg-blue-600 text-white'
            }
          `}
        >
          {isSpread ? '접기' : `${pageCount}p 펼치기`}
        </span>
      </button>
    </div>
  );
});
