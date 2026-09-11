import { httpClient } from './httpClient';

/**
 * Agent Runtime 전송 계층.
 *
 * 백엔드에서 `app/core/agent_runtime` 이 특정 도메인에 속하지 않는 것과 같은 이유로
 * 여기(`shared/api`)에 둡니다. 문서·스캐폴드 등 여러 엔티티가 같은 실행 프로토콜을
 * 쓰는데, 그중 한 엔티티가 이것을 소유하면 다른 엔티티가 그 슬라이스를 참조해야 하고
 * 레이어 규칙이 깨집니다.
 *
 * 여기에는 **프로토콜만** 둡니다. 상태 표현·재개 UI 같은 도메인 판단은
 * `entities/agent-run` 이 갖습니다.
 */
const BASE_PATH = '/api/v1/documents';

const POLL_INTERVAL_MS = 1000;

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting_for_configuration'
  | 'waiting_for_approval';

export const WAITING_STATUSES: readonly AgentRunStatus[] = [
  'waiting_for_configuration',
  'waiting_for_approval',
];

export const TERMINAL_STATUSES: readonly AgentRunStatus[] = ['completed', 'failed'];

/** 사람의 결정을 기다리는 중인가. 실패가 아니라 보류다. */
export function isWaiting(status: AgentRunStatus): boolean {
  return WAITING_STATUSES.includes(status);
}

/** 더 이상 저절로 바뀌지 않는 상태인가. 폴링을 멈춰야 하는 지점이다. */
export function isSettled(status: AgentRunStatus): boolean {
  return TERMINAL_STATUSES.includes(status) || isWaiting(status);
}

export interface AgentRunCost {
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  cache_read_tokens: number;
  total_tokens: number;
}

export interface AgentRunExecution {
  phase: 'routing' | 'running' | 'switched' | 'completed';
  provider?: 'agy-cli' | 'google-api' | null;
  model?: string | null;
  routeReason?: 'cli_available' | 'cli_quota_unknown' | 'cli_quota_exhausted' | 'cli_blocked' | 'cli_failed';
  fallbackFrom?: 'agy-cli' | null;
}

export interface AgentRun<TResult = Record<string, unknown>> {
  runId: string;
  status: AgentRunStatus;
  docId?: string | null;
  /** 같은 입력에 대한 시도 횟수. 재개할 때마다 늘어난다. */
  attempt: number;
  agreementId?: string | null;
  traceId?: string | null;
  cost: AgentRunCost;
  result?: TResult | null;
  errorCode?: string | null;
  execution?: AgentRunExecution | null;
}

/** 사람이 내려야 하는 결정 한 건. 서버 재시작을 넘어 살아남는다. */
export interface Agreement {
  agreement_id: string;
  kind: 'configure_google_api' | 'confirm_cost' | 'resume_run';
  status: 'pending' | 'approved' | 'declined';
  reason: string;
  run_id?: string | null;
  doc_id?: string | null;
  requested_at?: string;
}

export const agentRunClient = {
  get: <TResult = Record<string, unknown>>(runId: string) =>
    httpClient.get<AgentRun<TResult>>(`${BASE_PATH}/runs/${runId}`),

  resume: (runId: string) =>
    httpClient.post<{ runId: string; status: string }>(`${BASE_PATH}/runs/${runId}/resume`, {}),

  listPendingAgreements: () => httpClient.get<Agreement[]>(`${BASE_PATH}/agreements/pending`),

  decideAgreement: (agreementId: string, approved: boolean) =>
    httpClient.post<Agreement>(`${BASE_PATH}/agreements/${agreementId}`, { approved }),
};

/**
 * 실행이 **더 이상 저절로 바뀌지 않을 때까지** 상태를 따라갑니다.
 *
 * 멈추는 조건이 "종료"가 아니라는 점이 중요합니다. `waiting_*` 에서 계속 물어보면
 * 사람이 설정을 끝낼 때까지 요청만 쌓입니다.
 */
export async function followAgentRun<TResult = Record<string, unknown>>(
  runId: string,
  onProgress?: (run: AgentRun<TResult>) => void,
  shouldStop?: () => boolean
): Promise<AgentRun<TResult>> {
  let current = await agentRunClient.get<TResult>(runId);
  onProgress?.(current);

  while (!isSettled(current.status)) {
    if (shouldStop?.()) return current;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    current = await agentRunClient.get<TResult>(runId);
    onProgress?.(current);
  }

  return current;
}
