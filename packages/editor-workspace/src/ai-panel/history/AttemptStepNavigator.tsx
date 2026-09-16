import React, { memo } from 'react';
import { History, GitBranch, Check } from 'lucide-react';
import type { AttemptStepNavigatorProps } from './types';

/**
 * AttemptStepNavigator (시도 단계 네비게이터)
 *
 * Attempt #1, #2, #3을 오가며 과거 시도의 프롬프트 및 산출물을 비교하고 분기합니다.
 */
function AttemptStepNavigatorInner<TResult = string>({
  attempts,
  activeAttemptId,
  onSelectAttempt,
  onForkBranch,
  className = '',
}: AttemptStepNavigatorProps<TResult>) {
  if (!attempts || attempts.length === 0) return null;

  return (
    <div className={`flex items-center justify-between gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 ${className}`}>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <History className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-0.5" />
        {attempts.map((att) => {
          const isActive = att.id === activeAttemptId;
          return (
            <button
              key={att.id}
              type="button"
              onClick={() => onSelectAttempt(att.id)}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }
              `}
            >
              <span>Attempt #{att.attemptNumber}</span>
              {att.isAccepted && <Check className="w-2.5 h-2.5 text-emerald-300 shrink-0" />}
            </button>
          );
        })}
      </div>

      {onForkBranch && (
        <button
          type="button"
          onClick={() => onForkBranch(activeAttemptId)}
          title="이 시점부터 새로운 대안 브랜치 분기"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300 hover:bg-indigo-950 border border-indigo-700/60 hover:border-indigo-500 transition-colors shrink-0 cursor-pointer"
        >
          <GitBranch className="w-2.5 h-2.5" />
          <span>Fork</span>
        </button>
      )}
    </div>
  );
}

export const AttemptStepNavigator = memo(AttemptStepNavigatorInner) as <TResult = string>(
  props: AttemptStepNavigatorProps<TResult>
) => React.ReactElement | null;
