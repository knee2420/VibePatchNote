import { memo } from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import type { SocketStateBadgeProps } from './types';

/**
 * SocketStateBadge (소켓 매핑 상태 뱃지)
 *
 * Empty(미할당 빈 뼈대) | Filled(매핑 완료) | Conflict(불일치/위반) | Partial(부분 매핑)
 */
export const SocketStateBadge = memo(function SocketStateBadge({
  state,
  count,
  reason,
  className = '',
}: SocketStateBadgeProps) {
  switch (state) {
    case 'filled':
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 ${className}`}
          title={`매핑 완료: 근거 ${count ?? 1}건`}
        >
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
          <span>{count !== undefined ? `${count}` : 'Filled'}</span>
        </span>
      );

    case 'conflict':
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/90 border border-rose-600/80 text-rose-300 animate-pulse ${className}`}
          title={reason || '규격 불일치 또는 출처 데이터 충돌'}
        >
          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
          <span>Conflict</span>
        </span>
      );

    case 'partial':
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 border border-amber-600/70 text-amber-300 ${className}`}
          title={`부분 매핑: ${count ?? 0}건`}
        >
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span>{count !== undefined ? `${count}건` : 'Partial'}</span>
        </span>
      );

    case 'empty':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-dashed border-slate-700 text-slate-400 ${className}`}
          title="미할당 빈 뼈대 (에셋 드롭 가능)"
        >
          <CircleDashed className="w-2.5 h-2.5 text-slate-500" />
          <span>Empty</span>
        </span>
      );
  }
});
