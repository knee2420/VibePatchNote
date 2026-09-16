import React, { memo } from 'react';
import { RotateCcw, Clock, Cpu } from 'lucide-react';
import { AttemptStepNavigator } from './AttemptStepNavigator';
import type { RunHistoryTimelineProps } from './types';

/**
 * RunHistoryTimeline (생성 시도 이력 타임라인 & 브랜치 뷰어)
 *
 * 과거 프롬프트/응답 이력을 탐색하고, 원하는 과거 시점으로 문서를 롤백하거나 분기합니다.
 */
function RunHistoryTimelineInner<TResult = string>({
  attempts,
  activeAttemptId,
  onSelectAttempt,
  onForkBranch,
  onRollbackToAttempt,
  renderResult,
  className = '',
}: RunHistoryTimelineProps<TResult>) {
  const activeAttempt = attempts.find((a) => a.id === activeAttemptId) || attempts[attempts.length - 1];

  if (!attempts || attempts.length === 0) {
    return (
      <div className={`p-6 text-center text-slate-500 text-xs ${className}`}>
        실행 이력이 존재하지 않습니다.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 ${className}`}>
      {/* 1. 상단 네비게이터 */}
      <AttemptStepNavigator
        attempts={attempts}
        activeAttemptId={activeAttempt?.id || activeAttemptId}
        onSelectAttempt={onSelectAttempt}
        onForkBranch={onForkBranch}
      />

      {/* 2. 선택된 시도의 상세 정보 */}
      {activeAttempt && (
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/80 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(activeAttempt.timestamp).toLocaleTimeString()}</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-indigo-300">
                <Cpu className="w-3 h-3" />
                <span>{activeAttempt.modelName}</span>
              </span>

              {onRollbackToAttempt && (
                <button
                  type="button"
                  onClick={() => onRollbackToAttempt(activeAttempt)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>이 시점으로 롤백</span>
                </button>
              )}
            </div>
          </div>

          {/* 프롬프트 */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Prompt:</span>
            <p className="mt-0.5 text-slate-300 italic bg-slate-900/60 p-1.5 rounded leading-relaxed">
              "{activeAttempt.prompt}"
            </p>
          </div>

          {/* 결과물 렌더링 */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Result:</span>
            <div className="mt-0.5 p-2 rounded bg-slate-900 text-slate-200 leading-relaxed font-sans max-h-48 overflow-y-auto no-scrollbar">
              {renderResult ? (
                renderResult(activeAttempt.result)
              ) : (
                <div className="whitespace-pre-wrap">{String(activeAttempt.result)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const RunHistoryTimeline = memo(RunHistoryTimelineInner) as <TResult = string>(
  props: RunHistoryTimelineProps<TResult>
) => React.ReactElement | null;
