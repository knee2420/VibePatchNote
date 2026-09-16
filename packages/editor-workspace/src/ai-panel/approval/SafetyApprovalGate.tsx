import { memo } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import type { SafetyApprovalGateProps } from './types';

/**
 * SafetyApprovalGate (파괴적 변경 안전 승인 게이트)
 *
 * 전체 문서 덮어쓰기 등 위험도 높은 작업 전, 사용자의 명시적인 승인 확인을 요구하는 배너.
 */
export const SafetyApprovalGate = memo(function SafetyApprovalGate({
  title,
  description,
  riskLevel = 'medium',
  onConfirm,
  onCancel,
  confirmLabel = '확인 및 변경 적용',
  cancelLabel = '취소',
  className = '',
}: SafetyApprovalGateProps) {
  const getRiskTheme = () => {
    switch (riskLevel) {
      case 'high':
        return 'bg-rose-50/80 border-rose-200 text-rose-900';
      case 'medium':
        return 'bg-amber-50/80 border-amber-200 text-amber-900';
      case 'low':
      default:
        return 'bg-indigo-50/80 border-indigo-200 text-indigo-900';
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border shadow-xs ${getRiskTheme()} ${className}`}>
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
        <div className="flex-1 min-w-0">
          <h5 className="font-bold text-xs">{title}</h5>
          <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{cancelLabel}</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{confirmLabel}</span>
        </button>
      </div>
    </div>
  );
});
