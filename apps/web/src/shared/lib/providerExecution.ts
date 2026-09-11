import type { AgentRunExecution } from '@/shared/api';

const REASON: Record<NonNullable<AgentRunExecution['routeReason']>, string> = {
  cli_available: 'CLI 잔여량 확인 후 실행',
  cli_quota_unknown: 'CLI 잔여량 확인 불가 · 우선 실행',
  cli_quota_exhausted: 'CLI 잔여량 0% · API로 바로 시작',
  cli_blocked: 'CLI 사용 불가 상태 · API로 바로 시작',
  cli_failed: 'CLI 실패 후 API로 전환',
};

export function providerExecutionMessage(execution?: AgentRunExecution | null): string {
  if (!execution || execution.phase === 'routing') return 'AI 실행 경로를 확인하고 있습니다...';
  if (!execution.provider) return '사용 가능한 AI 실행 경로가 없습니다.';
  return execution.routeReason ? REASON[execution.routeReason] : 'AI가 작업을 처리하고 있습니다...';
}
