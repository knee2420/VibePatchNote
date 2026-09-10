import { httpClient } from '@/shared/api';

/** 공급자 하나의 설정 여부와 지금 쓸 수 있는지. 키 값은 절대 내려오지 않습니다. */
export interface LlmProvider {
  id: string;
  label: string;
  /** 키 등록 등 사용 준비가 끝났는가. */
  configured: boolean;
  /** 저장된 키의 표시 전용 마스킹 값. 원문은 절대 내려오지 않는다. */
  maskedKey?: string | null;
  role: 'primary' | 'fallback';
  /** 설정돼 있어도 한도 소진 등으로 지금은 못 쓸 수 있습니다. */
  available: boolean;
  /** 못 쓰는 사유. 예: QUOTA_EXHAUSTED */
  blockedReason?: string | null;
  blockedUntil?: string | null;
  /** 사람이 읽는 복구 예정 문구. 예: "약 39시간 12분 뒤" */
  recoversIn?: string | null;
}

export interface RuntimeModelOption {
  id: string;
  label: string;
  provider: string;
  inputTokenLimit?: number | null;
  outputTokenLimit?: number | null;
  supportsStructuredOutput: boolean;
}

export interface AgyContextWindow {
  used_percentage?: number;
  remaining_percentage?: number;
  current_usage?: number;
  context_window_size?: number;
}

export interface AgyQuotaBucket {
  remaining_fraction?: number;
  reset_time?: string;
  reset_in_seconds?: number;
}

export interface AgyStatusSnapshot {
  updatedAt?: string;
  model: { id?: string; display_name?: string };
  cliVersion?: string;
  planTier?: string;
  contextWindow: AgyContextWindow;
  quota: Record<string, AgyQuotaBucket>;
  agentState?: string;
  taskCount?: number;
  artifactCount?: number;
  executionMode?: string;
  exceeds200kTokens?: boolean | null;
}

export interface RuntimeDashboard {
  providers: LlmProvider[];
  models: RuntimeModelOption[];
  policy: {
    primaryProvider: string;
    primaryModel: string;
    primaryTimeoutSeconds: number;
    fallbackProvider: string;
    fallbackModel: string;
    fallbackTimeoutSeconds: number;
  };
  quotaNotice: string;
  agyStatus: AgyStatusSnapshot | null;
  agyStatusBridgeCommand: string;
  agyStatusLineInstalled: boolean;
}

export interface AgyUsageBucket {
  id: string;
  name: string;
  description?: string | null;
  window: string;
  disabled: boolean;
  remaining_fraction: number;
  reset_time?: string | null;
}

export interface AgyUsageGroup {
  name: string;
  description?: string | null;
  buckets: AgyUsageBucket[];
}

export interface AgyUsage {
  description: string;
  groups: AgyUsageGroup[];
}

export interface GoogleApiModel {
  id: string;
  label: string;
  inputTokenLimit?: number | null;
  outputTokenLimit?: number | null;
  supportsGenerateContent: boolean;
}

export const llmConfigurationApi = {
  list: () => httpClient.get<{ providers: LlmProvider[] }>('/api/v1/llm-settings/providers'),
  runtime: () => httpClient.get<RuntimeDashboard>('/api/v1/llm-settings/runtime'),
  usage: () => httpClient.get<AgyUsage>('/api/v1/llm-settings/runtime/usage'),
  googleModels: () => httpClient.get<{ models: GoogleApiModel[] }>('/api/v1/llm-settings/providers/google-api/models'),
  updatePolicy: (policy: RuntimeDashboard['policy']) => httpClient.put<RuntimeDashboard['policy']>('/api/v1/llm-settings/runtime/policy', policy),
  installAgyStatusLine: () => httpClient.post<{ settingsFile: string; installed: boolean }>('/api/v1/llm-settings/runtime/agy-statusline/install', {}),
  saveGoogleApiKey: (apiKey: string) =>
    httpClient.put<LlmProvider>('/api/v1/llm-settings/providers/google-api', { apiKey }),
  removeGoogleApiKey: () => httpClient.delete('/api/v1/llm-settings/providers/google-api'),
};
