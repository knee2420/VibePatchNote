import type { ViewerSegment } from '../../../types';

interface SegmentSummaryViewProps {
  segment: ViewerSegment;
  isSelected: boolean;
}

/** 호버 미리보기 / 클릭 고정 상태에서 보여주는 읽기 전용 스캐폴드 정보. */
export function SegmentSummaryView({ segment, isSelected }: SegmentSummaryViewProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-purple-300">{segment.label}</p>

      {segment.content_summary ? (
        <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-800/40 p-2 rounded border border-slate-700/40 line-clamp-4">
          {segment.content_summary}
        </p>
      ) : (
        <p className="text-[10px] text-slate-400 italic">내용 요약 없음</p>
      )}

      <p className="text-[9px] text-slate-400 pt-0.5">
        {isSelected ? (
          <span className="text-purple-400 font-medium">💡 더블 클릭하여 라벨 및 타입 편집</span>
        ) : (
          <span>클릭하여 정보 고정 · 더블클릭하여 편집</span>
        )}
      </p>
    </div>
  );
}
