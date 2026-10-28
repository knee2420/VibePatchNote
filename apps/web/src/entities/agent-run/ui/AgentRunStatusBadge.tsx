import type { AgentRunStatus } from '@/shared/api';

/**
 * 실행 상태 배지.
 *
 * 보류(`waiting_*`)를 실패와 다른 색으로 그리는 것이 이 컴포넌트의 존재 이유입니다.
 * 둘을 같게 그리면 사용자는 풀리지 않는 재시도만 반복하게 됩니다.
 */
const PRESENTATION: Record<AgentRunStatus | 'idle', { label: string; className: string }> = {
  idle: { label: '대기 없음', className: 'bg-slate-100 text-slate-500' },
  queued: { label: '대기열', className: 'bg-slate-100 text-slate-600' },
  running: { label: '분석 중', className: 'bg-blue-50 text-blue-600' },
  completed: { label: '완료', className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: '실패', className: 'bg-rose-50 text-rose-700' },
  waiting_for_configuration: { label: '설정 필요', className: 'bg-amber-50 text-amber-700' },
  waiting_for_approval: { label: '승인 대기', className: 'bg-amber-50 text-amber-700' },
};

interface AgentRunStatusBadgeProps {
  status: AgentRunStatus | 'idle';
  attempt?: number;
}

export function AgentRunStatusBadge({ status, attempt }: AgentRunStatusBadgeProps) {
  const { label, className } = PRESENTATION[status] ?? PRESENTATION.idle;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
      {attempt && attempt > 1 ? <span className="opacity-70">· {attempt}회차</span> : null}
    </span>
  );
}
