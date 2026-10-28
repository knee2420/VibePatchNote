import { RefreshCw } from 'lucide-react';

import { Button } from '@/shared/ui';

import { useCliUsage } from '../model/useCliUsage';

/** AGY CLI 계정의 모델 quota. CLI 가 알려 주는 값만 그대로 보여 줍니다. */
export function CliUsagePanel() {
  const { usage, error, isLoading, refresh } = useCliUsage();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">AGY CLI 사용 현황</h3>
          <p className="mt-1 text-xs text-slate-500">연결된 CLI가 제공하는 현재 quota만 표시합니다.</p>
        </div>
        <Button disabled={isLoading} onClick={refresh} size="sm" variant="outline">
          <RefreshCw className={isLoading ? 'animate-spin' : undefined} />
          새로고침
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      )}

      {usage?.groups.map((group) => (
        <section className="mt-4" key={group.name}>
          <h4 className="text-sm font-medium">{group.name}</h4>
          <div className="mt-2 overflow-hidden rounded-lg border">
            {group.buckets.map((bucket) => (
              <div className="flex items-center justify-between gap-4 border-b p-3 text-sm last:border-b-0" key={bucket.id}>
                <span>
                  <b>{bucket.name}</b>
                  <small className="ml-2 text-slate-500">{bucket.description}</small>
                </span>
                <b className="shrink-0">{bucket.disabled ? '—' : `${Math.round(bucket.remaining_fraction * 100)}%`}</b>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
