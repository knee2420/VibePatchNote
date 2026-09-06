import { memo } from 'react';

import type { ViewerHighlight } from '../../types';

interface PdfHighlightOverlayProps {
  pageNumber: number;
  highlight?: ViewerHighlight | null;
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
  highlight,
}: PdfHighlightOverlayProps) {
  if (!highlight || highlight.page !== pageNumber) return null;

  const [ymin, xmin, ymax, xmax] = highlight.box_2d;
  const top = Math.max(ymin - PAD_Y, 0) / 10;
  const left = Math.max(xmin - PAD_X, 0) / 10;
  const bottom = Math.min(ymax + PAD_Y, 1000) / 10;
  const right = Math.min(xmax + PAD_X, 1000) / 10;

  return (
    <div
      className="absolute z-30 pointer-events-none rounded-md border-2 border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-2 ring-purple-400/40 transition-all duration-150 ease-out"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${Math.max(right - left, 0.8)}%`,
        height: `${Math.max(bottom - top, 0.8)}%`,
      }}
    >
      <div className="absolute -top-6 left-0 flex items-center gap-1 select-none whitespace-nowrap">
        {highlight.number !== undefined && (
          <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px] font-mono shadow">
            #{highlight.number}
          </span>
        )}
        {highlight.label && (
          <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-purple-200 font-semibold text-[10px] shadow max-w-[200px] truncate">
            {highlight.label}
          </span>
        )}
      </div>
    </div>
  );
});
