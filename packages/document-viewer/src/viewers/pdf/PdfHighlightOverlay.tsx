import { memo } from 'react';

import { INTERNAL_COORDINATE_SCALE } from '../../coordinates';
import type { ViewerHighlight } from '../../types';

interface PdfHighlightOverlayProps {
  pageNumber: number;
  highlights?: ViewerHighlight[];
}

/** 좌표가 테두리에 바짝 붙어 잘려 보이지 않도록 주는 시각적 여백(정규화 단위). */
const PAD_X = 4;
const PAD_Y = 3;

/**
 * PdfHighlightOverlay
 *
 * 서식 슬롯 ↔ 원본 문서 영역을 잇는 동기화 강조 박스.
 *
 * `PdfSegmentOverlay` 와 **같은 좌표 기준면**(페이지 요소)에 붙는다. 이것이
 * 핵심이다 — 뷰어 컨테이너에 붙이면 패딩·페이지 간격·스크롤·다중 페이지만큼
 * 어긋난다. 자기 페이지가 아닌 강조는 그리지 않는다.
 */
export const PdfHighlightOverlay = memo(function PdfHighlightOverlay({
  pageNumber,
  highlights,
}: PdfHighlightOverlayProps) {
  const visible = (highlights ?? []).filter((item) => item.page === pageNumber);
  if (visible.length === 0) return null;

  // 배경(context)을 먼저 깔고 고른 것(primary)을 위에 올린다.
  const ordered = [...visible].sort((left, right) =>
    (left.variant === 'context' ? 0 : 1) - (right.variant === 'context' ? 0 : 1)
  );

  return <>{ordered.map((item) => <HighlightBox key={`${item.variant ?? 'primary'}:${item.id}`} highlight={item} />)}</>;
});

function HighlightBox({ highlight }: { highlight: ViewerHighlight }) {
  const isContext = highlight.variant === 'context';
  const [ymin, xmin, ymax, xmax] = highlight.box;
  const top = Math.max(ymin - PAD_Y, 0) / 10;
  const left = Math.max(xmin - PAD_X, 0) / 10;
  const bottom = (Math.min(ymax + PAD_Y, INTERNAL_COORDINATE_SCALE) / INTERNAL_COORDINATE_SCALE) * 100;
  const right = (Math.min(xmax + PAD_X, INTERNAL_COORDINATE_SCALE) / INTERNAL_COORDINATE_SCALE) * 100;

  return (
    <div
      className={`absolute pointer-events-none rounded-md transition-all duration-150 ease-out ${
        isContext
          ? 'z-20 border-2 border-dashed border-violet-500 bg-violet-500/5'
          : 'z-30 border-2 border-indigo-500 bg-indigo-500/15 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-2 ring-indigo-400/30'
      }`}
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${Math.max(right - left, 0.8)}%`,
        height: `${Math.max(bottom - top, 0.8)}%`,
      }}
    >
      <div className="absolute -top-6 left-0 flex items-center gap-1 select-none whitespace-nowrap">
        {highlight.number !== undefined && (
          <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-semibold text-[10px] font-mono shadow-xs">
            #{highlight.number}
          </span>
        )}
        {highlight.label && (
          <span
            className={`px-1.5 py-0.5 rounded font-medium text-[10px] shadow-xs max-w-[200px] truncate border ${
              isContext
                ? 'bg-violet-50 text-violet-800 border-violet-300'
                : 'bg-white/95 text-slate-800 border-slate-200/90'
            }`}
          >
            {highlight.label}
          </span>
        )}
      </div>
    </div>
  );
}
