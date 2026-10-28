import { memo, useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ToolCallCardProps } from './types';

/**
 * ToolCallCard (도구 호출 카드)
 *
 * 에이전트가 호출한 외부 도구(도구명, 인자 Args, 반환 Result, 소요시간)를 인라인으로 시각화.
 */
export const ToolCallCard = memo(function ToolCallCard({
  toolCall,
  className = '',
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'calling':
        return <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-rose-400" />;
    }
  };

  const formatPayload = (payload?: Record<string, unknown> | string) => {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl bg-white border border-slate-200 text-xs overflow-hidden shadow-2xs ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-2 bg-slate-50/60 hover:bg-slate-100/80 transition-colors text-left select-none cursor-pointer"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-mono font-semibold text-slate-800 truncate">{toolCall.toolName}</span>
          {toolCall.durationMs !== undefined && (
            <span className="text-[10px] text-slate-400 font-mono">({toolCall.durationMs}ms)</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {getStatusIcon()}
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 space-y-2 border-t border-slate-100 bg-white text-[11px] font-mono">
          {toolCall.arguments && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Arguments:</span>
              <pre className="mt-0.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 overflow-x-auto max-h-32 text-[10px] leading-relaxed">
                {formatPayload(toolCall.arguments)}
              </pre>
            </div>
          )}

          {toolCall.result && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Result:</span>
              <pre className="mt-0.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-emerald-700 overflow-x-auto max-h-36 text-[10px] leading-relaxed">
                {formatPayload(toolCall.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
