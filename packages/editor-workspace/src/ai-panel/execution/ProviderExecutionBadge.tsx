import { memo } from 'react';
import { Cpu, Zap, RotateCcw } from 'lucide-react';
import type { ProviderExecutionBadgeProps } from './types';

/**
 * ProviderExecutionBadge (LLM 공급자/모델 실행 뱃지)
 *
 * 모델명, 레이턴시(ms), 소비 토큰 수, 폴백 여부를 컴팩트하게 노출.
 */
export const ProviderExecutionBadge = memo(function ProviderExecutionBadge({
  info,
  className = '',
}: ProviderExecutionBadgeProps) {
  const tokenCount = info.totalTokens ?? (info.inputTokens && info.outputTokens ? info.inputTokens + info.outputTokens : undefined);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-slate-700/80 text-slate-300 select-none ${className}`}
      title={`공급자: ${info.provider} | 모델: ${info.model}${info.latencyMs ? ` | 소요시간: ${info.latencyMs}ms` : ''}${tokenCount ? ` | 토큰: ${tokenCount}` : ''}`}
    >
      <div className="flex items-center gap-1 text-indigo-400">
        <Cpu className="w-2.5 h-2.5 shrink-0" />
        <span className="font-semibold text-indigo-200">{info.model}</span>
      </div>

      {info.latencyMs !== undefined && (
        <span className="text-slate-500 flex items-center gap-0.5">
          <Zap className="w-2 h-2 text-amber-400" />
          <span>{info.latencyMs}ms</span>
        </span>
      )}

      {tokenCount !== undefined && (
        <span className="text-slate-500">
          {tokenCount.toLocaleString()} toks
        </span>
      )}

      {info.fallbackUsed && (
        <span className="flex items-center gap-0.5 text-amber-400 font-semibold" title="자동 폴백 모델 적용됨">
          <RotateCcw className="w-2 h-2" />
          <span>Fallback</span>
        </span>
      )}
    </div>
  );
});
