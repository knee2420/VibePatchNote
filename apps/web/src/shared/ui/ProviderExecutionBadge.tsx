import { Cloud, Route, Terminal } from 'lucide-react';

import type { AgentRunExecution } from '@/shared/api';

interface Props {
  execution?: AgentRunExecution | null;
  compact?: boolean;
}

export function ProviderExecutionBadge({ execution, compact = false }: Props) {
  if (!execution || execution.phase === 'routing' || !execution.provider) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
        <Route className="size-3" /> {execution && execution.phase !== 'routing' ? '실행 경로 없음' : '경로 확인 중'}
      </span>
    );
  }
  const isApi = execution.provider === 'google-api';
  const Icon = isApi ? Cloud : Terminal;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        isApi
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
      }`}>
        <Icon className="size-3" />
        {execution.phase === 'switched' ? 'API 전환' : isApi ? 'Google API' : 'AGY CLI'}
      </span>
      {!compact && execution.model && (
        <span className="truncate font-mono text-[10px] text-slate-500" title={execution.model}>
          {execution.model}
        </span>
      )}
    </span>
  );
}
