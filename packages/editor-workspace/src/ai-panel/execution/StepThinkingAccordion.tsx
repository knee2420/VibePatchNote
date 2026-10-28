import { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Brain,
} from 'lucide-react';
import { ToolCallCard } from './ToolCallCard';
import { ProviderExecutionBadge } from './ProviderExecutionBadge';
import type { StepThinkingAccordionProps } from './types';

/**
 * StepThinkingAccordion (단계별 CoT 추론 아코디언)
 *
 * 에이전트의 단계별 생각(Thinking/Thought), 실행 중인 도구, 공급자 메타데이터를 접고 펼쳐 관측합니다.
 */
export const StepThinkingAccordion = memo(function StepThinkingAccordion({
  step,
  defaultExpanded = true,
  className = '',
}: StepThinkingAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'failed':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'pending':
      default:
        return <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className={`flex flex-col rounded-xl bg-white border border-slate-200 text-xs overflow-hidden shadow-2xs ${className}`}>
      {/* 헤더 바 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-2.5 bg-slate-50/60 hover:bg-slate-100/80 transition-colors text-left select-none cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getStatusIcon()}
          <span className="font-semibold text-slate-800 truncate">
            Step {step.stepNumber}: {step.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {step.executionInfo && <ProviderExecutionBadge info={step.executionInfo} />}
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* 펼쳐진 본문 (생각 내용 + 도구 호출들) */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-2.5 border-t border-slate-100 bg-white">
          {/* 에이전트 생각 (CoT) */}
          {step.thought && (
            <div className="flex items-start gap-2 pt-2 text-slate-700 leading-relaxed text-xs">
              <Brain className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-wrap font-sans">{step.thought}</div>
            </div>
          )}

          {/* 도구 호출 목록 */}
          {step.toolCalls && step.toolCalls.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tool Calls ({step.toolCalls.length})
              </div>
              {step.toolCalls.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {step.extra && <div className="pt-1">{step.extra}</div>}
        </div>
      )}
    </div>
  );
});
