import { memo } from 'react';
import { Play, MessageSquare, XCircle, FileSpreadsheet } from 'lucide-react';
import type { PlanApprovalGateProps } from './types';

/**
 * PlanApprovalGate (안티그래비티 계획 검토 승인 배너)
 *
 * 파괴적 작업 전 수립된 계획을 검토하고 [Proceed], [계획 수정 요청], [거절]을 선택하는 3단 바.
 */
export const PlanApprovalGate = memo(function PlanApprovalGate({
  planTitle,
  totalSteps,
  onProceed,
  onRequestChanges,
  onReject,
  className = '',
}: PlanApprovalGateProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-indigo-500/70 shadow-xl text-xs ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-slate-200 truncate">{planTitle}</div>
          <div className="text-[11px] text-slate-400">총 {totalSteps}개 세부 실행 단계 수립됨 (승인 대기)</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onReject}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>거절</span>
        </button>

        {onRequestChanges && (
          <button
            type="button"
            onClick={onRequestChanges}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>수정 요청</span>
          </button>
        )}

        <button
          type="button"
          onClick={onProceed}
          className="flex items-center gap-1 px-3.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Proceed (실행)</span>
        </button>
      </div>
    </div>
  );
});
