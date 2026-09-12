export type SpanType = 'workflow' | 'pipeline' | 'chain' | 'llm' | 'tool' | 'parser' | 'custom'
export type SpanPhase = 'pre_llm' | 'llm' | 'post_llm'
export type SpanStatus = 'SUCCESS' | 'FAILED' | 'FALLBACK_TRIGGERED' | 'CANCELLED' | 'RUNNING'

export interface ModelAttemptRecord {
  attempt_index: number
  provider: string
  model: string
  duration_ms: number
  status: 'SUCCESS' | 'FAILED'
  failure_reason?: string
  error_message?: string
  input_tokens: number
  output_tokens: number
  thinking_tokens: number
  cache_read_tokens: number
  cost_usd: number
  raw_command?: string
  exit_code?: number
  stderr_sample?: string
  timestamp: string
}

export interface SpanRecord {
  span_id: string
  parent_span_id?: string | null
  dotted_order: string
  span_type: SpanType
  phase?: SpanPhase | null
  display_label?: string | null
  description?: string | null
  summary_pill?: string | null
  node_id?: string | null
  node_title?: string | null
  data_in?: string | null
  data_out?: string | null
  data_via?: string[] | null
  name: string
  start_time: string
  end_time?: string
  duration_ms: number
  status: SpanStatus
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: {
    code: string
    message: string
    timestamp: string
    traceback?: string
  } | null
  metadata?: Record<string, any>
  usage?: Record<string, any>
  attempts?: ModelAttemptRecord[]
}

export interface RunSummary {
  run_id: string
  task_name: string
  domain: string
  workflow_name: string
  workflow_label: string
  target_name?: string | null
  doc_id?: string | null
  status: string
  total_duration_ms: number
  total_tokens: number
  input_tokens: number
  output_tokens: number
  thinking_tokens: number
  cache_read_tokens: number
  cost_usd: number
  created_at: string
  primary_provider?: string | null
  primary_model?: string | null
  spans_count: number
  snapshots_count: number
}

export interface RunDetail {
  meta: Record<string, any>
  spans: SpanRecord[]
  snapshots: Record<string, any>
}

export interface MatrixModelInfo {
  name: string
  family: string
  provider: string
  max_input_tokens: number
  max_output_tokens: number
  supports_structured_schema: boolean
  display_name: string
  description: string
  active: boolean
}

export interface MatrixResponse {
  primary_provider: string
  fallback_provider: string
  models: MatrixModelInfo[]
}

export interface SourceCodeResponse {
  file_path: string
  symbol?: string | null
  content: string
  start_line: number
  end_line: number
  total_lines: number
  language: string
}

export interface CompareItem {
  readonly id: string
  readonly type: 'run' | 'span' | 'inputs' | 'outputs' | 'code' | 'json'
  readonly title: string
  readonly subtitle?: string
  readonly content: string
  readonly language: string
  readonly runId?: string
  readonly spanId?: string
}

