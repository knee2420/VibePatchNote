import { memo } from 'react';
import { Activity } from 'lucide-react';
import { StepThinkingAccordion } from './StepThinkingAccordion';
import type { AgentStepStreamProps } from './types';

/**
 * AgentStepStream (단계별 추론 관측 스트림)
 *
 * 에이전트의 다단계 파이프라인(계획 ➔ 탐색 ➔ 합성 ➔ 검증)을 실시간 타임라인으로 보여줍니다.
 */
export const AgentStepStream = memo(function AgentStepStream({
  steps,
  isLive = false,
  className = '',
}: AgentStepStreamProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center text-slate-500 ${className}`}>
        <Activity className="w-6 h-6 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs font-medium">대기 중인 에이전트 실행 과정이 없습니다.</p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          프롬프트를 전송하면 실시간 추론 단계가 이곳에 스트리밍됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 overflow-y-auto no-scrollbar ${className}`}>
      {isLive && (
        <div className="flex items-center justify-between px-1 text-[11px] text-indigo-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            에이전트가 단계를 분석 중입니다...
          </span>
          <span className="font-mono text-[10px] text-slate-500">Live Streaming</span>
        </div>
      )}

      {steps.map((step) => (
        <StepThinkingAccordion
          key={step.id}
          step={step}
          defaultExpanded={step.status === 'running' || step.status === 'failed'}
        />
      ))}
    </div>
  );
});
