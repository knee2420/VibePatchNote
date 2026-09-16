import type { ReactNode } from 'react';

/** 도구 호출 정보 */
export interface ToolCallItem {
  id: string;
  toolName: string;
  arguments?: Record<string, unknown> | string;
  result?: Record<string, unknown> | string;
  status: 'calling' | 'success' | 'error';
  durationMs?: number;
}

/** LLM 공급자 실행 정보 */
export interface ProviderExecutionInfo {
  provider: string;
  model: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  fallbackUsed?: boolean;
}

/** 에이전트 실행 단계(Step) 모델 */
export interface AgentExecutionStep {
  id: string;
  stepNumber: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  thought?: string;
  toolCalls?: ToolCallItem[];
  executionInfo?: ProviderExecutionInfo;
  startedAt?: number;
  completedAt?: number;
  extra?: ReactNode;
}

/** 단계별 씽킹 아코디언 Props */
export interface StepThinkingAccordionProps {
  step: AgentExecutionStep;
  defaultExpanded?: boolean;
  className?: string;
}

/** 도구 호출 카드 Props */
export interface ToolCallCardProps {
  toolCall: ToolCallItem;
  className?: string;
}

/** 공급자 실행 뱃지 Props */
export interface ProviderExecutionBadgeProps {
  info: ProviderExecutionInfo;
  className?: string;
}

/** 단계별 추론 관측 스트림 Props */
export interface AgentStepStreamProps {
  steps: AgentExecutionStep[];
  isLive?: boolean;
  className?: string;
}
