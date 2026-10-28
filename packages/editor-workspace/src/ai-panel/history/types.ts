import type { ReactNode } from 'react';
import type { ProviderExecutionInfo } from '../execution/types';

/** 시도(Attempt) 이력 모델 */
export interface RunAttemptItem<TResult = string> {
  id: string;
  attemptNumber: number;
  timestamp: number;
  prompt: string;
  result: TResult;
  modelName: string;
  executionInfo?: ProviderExecutionInfo;
  isAccepted?: boolean;
  branchName?: string;
  extra?: ReactNode;
}

/** 시도 네비게이터 Props */
export interface AttemptStepNavigatorProps<TResult = string> {
  attempts: RunAttemptItem<TResult>[];
  activeAttemptId: string;
  onSelectAttempt: (attemptId: string) => void;
  onForkBranch?: (attemptId: string) => void;
  className?: string;
}

/** 실행 이력 타임라인 Props */
export interface RunHistoryTimelineProps<TResult = string> {
  attempts: RunAttemptItem<TResult>[];
  activeAttemptId: string;
  onSelectAttempt: (attemptId: string) => void;
  onForkBranch?: (attemptId: string) => void;
  onRollbackToAttempt?: (attempt: RunAttemptItem<TResult>) => void;
  renderResult?: (result: TResult) => ReactNode;
  className?: string;
}
