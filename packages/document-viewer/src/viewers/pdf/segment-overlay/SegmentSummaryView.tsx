import type { ViewerSegment } from '../../../types';

interface SegmentSummaryViewProps {
  segment: ViewerSegment;
  isSelected: boolean;
}

/** 호버 미리보기 / 클릭 고정 상태에서 보여주는 읽기 전용 스캐폴드 정보. */
export function SegmentSummaryView({ segment, isSelected }: SegmentSummaryViewProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-800">{segment.label}</p>

      {segment.content_summary ? (
        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 line-clamp-4">
          {segment.content_summary}
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 italic">내용 요약 없음</p>
      )}

      <p className="text-[10px] text-slate-400 pt-0.5">
        {isSelected ? (
          <span className="text-indigo-600 font-medium">💡 더블 클릭하여 라벨 및 타입 편집</span>
        ) : (
          <span>클릭하여 정보 고정 · 더블클릭하여 편집</span>
        )}
      </p>
    </div>
  );
}
