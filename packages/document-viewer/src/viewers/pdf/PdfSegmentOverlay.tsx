import { memo, useMemo, useState } from 'react';
import type { ViewerSegment } from '../../types';

interface PdfSegmentOverlayProps {
  pageNumber: number;
  segments?: ViewerSegment[];
  onSelectSegment?: (segment: ViewerSegment) => void;
}

const typeStyles: Record<
  string,
  {
    border: string;
    bg: string;
    hoverBg: string;
    badgeBg: string;
    badgeText: string;
    defaultLabel: string;
  }
> = {
  table: {
    border: 'border-purple-500/90',
    bg: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/25',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    defaultLabel: 'Table',
  },
  list: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/25',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    defaultLabel: 'List',
  },
  section: {
    border: 'border-blue-500/90',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/25',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    defaultLabel: 'Section',
  },
  paragraph: {
    border: 'border-amber-500/90',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/25',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    defaultLabel: 'Block',
  },
};

export const PdfSegmentOverlay = memo(function PdfSegmentOverlay({
  pageNumber,
  segments = [],
  onSelectSegment,
}: PdfSegmentOverlayProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // 현재 페이지에 속한 세그먼트만 필터링
  const pageSegments = useMemo(() => {
    return segments.filter((seg) => seg.page === pageNumber);
  }, [segments, pageNumber]);

  if (!pageSegments || pageSegments.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {pageSegments.map((seg) => {
        const [ymin, xmin, ymax, xmax] = seg.box_2d;
        const top = ymin / 10;
        const left = xmin / 10;
        const height = (ymax - ymin) / 10;
        const width = (xmax - xmin) / 10;

        const styleConfig = typeStyles[seg.type] || typeStyles.paragraph;
        const isActive = activeSegmentId === seg.id;

        return (
          <div
            key={seg.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSegment?.(seg);
            }}
            onMouseEnter={() => setActiveSegmentId(seg.id)}
            onMouseLeave={() => setActiveSegmentId(null)}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              height: `${height}%`,
              width: `${width}%`,
            }}
            className={`
              absolute pointer-events-auto border-2 rounded-sm cursor-pointer
              transition-all duration-200 select-none group/seg
              ${styleConfig.border}
              ${styleConfig.bg}
              ${styleConfig.hoverBg}
              ${isActive ? '!border-purple-600 ring-2 ring-purple-400/60 shadow-lg !bg-purple-500/20 z-20 scale-[1.004]' : 'z-10'}
            `}
            title={seg.content_summary || seg.label}
          >
            {/* Top-Left Type & Label Badge */}
            <div
              className={`
                absolute -top-3 left-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs
                flex items-center gap-1 transition-transform duration-150
                ${styleConfig.badgeBg} ${styleConfig.badgeText}
                ${isActive ? 'scale-105 shadow-md' : 'opacity-90 group-hover/seg:opacity-100'}
              `}
            >
              <span className="uppercase text-[9px] opacity-85">
                {styleConfig.defaultLabel}
              </span>
              <span className="max-w-[140px] truncate font-medium">
                {seg.label}
              </span>
            </div>

            {/* Hover Tooltip for Content Summary */}
            {seg.content_summary && isActive && (
              <div className="absolute left-1 top-full mt-1 z-30 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] leading-snug p-2 rounded-md shadow-xl max-w-[240px] pointer-events-none border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150">
                <p className="font-semibold text-purple-300 mb-0.5">{seg.label}</p>
                <p className="text-slate-200 text-[10px] line-clamp-3">{seg.content_summary}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
