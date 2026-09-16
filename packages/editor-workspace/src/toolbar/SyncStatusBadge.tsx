import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { SyncStatusBadgeProps, SyncStatusType } from './types';

const defaultLabels: Record<SyncStatusType, string> = {
  idle: '실시간 동기화 대기',
  saving: '아카이브 저장 중...',
  saved: '보관함 저장 완료',
  error: '동기화 오류',
};

/**
 * 실시간 문서 동기화/저장 상태를 나타내는 배지 인디케이터 컴포넌트.
 */
export function SyncStatusBadge({
  status,
  labels,
  className = '',
}: SyncStatusBadgeProps) {
  const mergedLabels = { ...defaultLabels, ...labels };

  switch (status) {
    case 'saving':
      return (
        <span
          className={`px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 text-xs font-medium ${className}`}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{mergedLabels.saving}</span>
        </span>
      );
    case 'saved':
      return (
        <span
          className={`px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 text-xs font-medium ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{mergedLabels.saved}</span>
        </span>
      );
    case 'error':
      return (
        <span
          className={`px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 text-xs font-medium ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{mergedLabels.error}</span>
        </span>
      );
    case 'idle':
    default:
      return (
        <span
          className={`px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1.5 text-xs font-medium ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{mergedLabels.idle}</span>
        </span>
      );
  }
}
