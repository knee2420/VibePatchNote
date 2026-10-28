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
    <div className={`flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80 ${className}`}>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <History className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-0.5" />
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
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }
              `}
            >
              <span>Attempt #{att.attemptNumber}</span>
              {att.isAccepted && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {onForkBranch && (
        <button
          type="button"
          onClick={() => onForkBranch(activeAttemptId)}
          title="이 시점부터 새로운 대안 브랜치 분기"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shrink-0 cursor-pointer font-medium"
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
