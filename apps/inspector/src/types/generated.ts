/**
 * 이 파일은 생성물입니다. 직접 수정하지 마십시오.
 *
 *   생성: python apps/api/scripts/generate_inspector_types.py
 *   원본: packages/agent-telemetry/agent_telemetry/contracts/
 *         apps/api/app/inspector/schemas.py
 *
 * 손으로 베낀 타입은 갈라집니다. 백엔드 계약을 바꿨으면 이 파일을 다시 생성하십시오.
 * CI 가 `--check` 로 커밋본과 생성물을 비교합니다.
 *
 * 정본: .agents/rules/60-data/observability.md
 */


// ── 열거형 ──────────────────────────────────────────────

export type SpanType = 'pipeline' | 'chain' | 'llm' | 'tool' | 'parser'

export type SpanPhase = 'pre_llm' | 'llm' | 'post_llm'

export type SpanStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export type ExecutionProtocol = 'cli_subprocess' | 'direct_rest_api' | 'local_serving'

export type FailureReason = 'timeout' | 'rate_limit_429' | 'process_crash' | 'auth_error' | 'schema_validation_error' | 'unknown'


// ── 계약 ────────────────────────────────────────────────

/** 스팬이 거쳐 간 코드 지점 하나. */
export interface SpanSource {
  /** import 가능한 모듈 이름 (예: scaffold_engine.outline.pipeline) */
  readonly module: string
  /** 모듈 안의 한정 이름 (예: OutlinePipeline.execute). 모듈 자체면 빈 문자열 */
  readonly qualname: string
  /** 정의 시작 줄. 모르면 0 */
  readonly lineno: number
  /** 이 지점의 종류 */
  readonly kind: 'function' | 'method' | 'class' | 'module' | 'prompt' | 'model'
  /** 사람이 읽을 이름. 없으면 소비자가 qualname 으로 만든다 */
  readonly label: string | null
}

/** 토큰 소모량 및 소요 시간 집계. */
export interface SpanUsage {
  /** 입력 프롬프트 토큰 수 */
  readonly prompt_tokens: number
  /** 출력 생성 토큰 수 */
  readonly completion_tokens: number
  /** 사고/추론 토큰 수 */
  readonly reasoning_tokens: number | null
  /** 프롬프트 캐시로 재사용된 토큰 수 */
  readonly cache_read_tokens: number
  /** 총 토큰 수 */
  readonly total_tokens: number
  /** 소요 시간 (밀리초) */
  readonly latency_ms: number
  /** 예상 비용 (달러). 모르면 None */
  readonly estimated_cost_usd: number | null
}

/** 장애 발생 시 에러 상세 구조 */
export interface SpanError {
  /** 에러 식별 코드 (예: CLI_TIMEOUT, HTTP_429) */
  readonly code: string
  /** 에러 메시지 */
  readonly message: string
  /** 장애 원인 분류 */
  readonly failure_reason: FailureReason
  /** 파이썬 예외 트레이스백 */
  readonly stack_trace: string | null
  /** CLI stderr 표준 에러 버퍼 */
  readonly stderr: string | null
}

/** 코딩 에이전트 및 CLI 환경 메타데이터 */
export interface SpanMetadata {
  /** 런타임 식별자 (예: agy-cli 2.0, google-genai-sdk) */
  readonly agent_runtime: string
  /** 실행 프로토콜 */
  readonly execution_protocol: ExecutionProtocol
  /** 하네스 공급자 (agy_cli, google_api, local_serving) */
  readonly provider: string
  /** 실행 모델명 */
  readonly model_name: string
  /** 문서 또는 세션 ID */
  readonly thread_id: string | null
  /** 현재 Git 브랜치 */
  readonly git_branch: string | null
  /** 현재 Git 커밋 해시 */
  readonly git_commit_sha: string | null
  /** 실행 작업 디렉터리 */
  readonly working_directory: string | null
  /** 실행된 CLI 인자 배열 */
  readonly cli_command: string[] | null
  /** 프로세스 종료 코드 */
  readonly exit_code: number | null
  /** 기타 임의 메타데이터 */
  readonly extra: Record<string, unknown>
}

/** 단일 실행 스팬 모델 (LangSmith Run 호환) */
export interface SpanRecord {
  /** 고유 스팬 식별자 */
  readonly span_id: string
  /** 최상위 파이프라인 실행 ID (run_id) */
  readonly trace_id: string
  /** 직속 부모 스팬 ID */
  readonly parent_span_id: string | null
  /** 계층 정렬 키 (<시작시간>Z<루트ID>.<시작시간>Z<자식ID>) */
  readonly dotted_order: string
  /** 작업 논리명 */
  readonly name: string
  /** 스팬 유형 */
  readonly span_type: SpanType
  /** 스팬 상태 */
  readonly status: SpanStatus
  /** 실행 페이즈 (pre_llm, llm, post_llm) */
  readonly phase: SpanPhase | null
  /** 이용자 친화적 한글 라벨 */
  readonly display_label: string | null
  /** 이용자 관점 상세 설명 */
  readonly description: string | null
  /** 성과 한 줄 요약 뱃지 */
  readonly summary_pill: string | null
  /** 다중 노드 식별자 */
  readonly node_id: string | null
  /** 다중 노드 명칭 */
  readonly node_title: string | null
  /** 입력 파일명 또는 입력 데이터/객체/리스트명 */
  readonly data_in: string | null
  /** 출력 파일명 또는 출력 데이터/객체/리스트명 */
  readonly data_out: string | null
  /** 이 스팬이 거쳐 간 코드 지점 (module·qualname). 경로 해석은 호스트가 한다 */
  readonly sources: SpanSource[]
  /** [deprecated] 관여 파일/클래스/함수 체인 문자열. `sources` 를 쓸 것 */
  readonly data_via: string[]
  /** 시작 시각 (UTC) */
  readonly start_time: string
  /** 종료 시각 (UTC) */
  readonly end_time: string | null
  /** 입력 매개변수 */
  readonly inputs: Record<string, unknown>
  /** 산출 결과 */
  readonly outputs: Record<string, unknown> | null
  /** 실패 시 에러 정보 */
  readonly error: SpanError | null
  /** 런타임 메타데이터 */
  readonly metadata: SpanMetadata
  /** 토큰 및 성능 사용량 */
  readonly usage: SpanUsage
  /** 스팬의 실행 시간 (밀리초) */
  readonly duration_ms: number
}

/** 단일 LLM 호출 시도 기록 (Fallback 체인 내부 요소) */
export interface ModelAttemptRecord {
  /** 시도 순번 (1부터 시작) */
  readonly attempt_index: number
  /** 공급자 (agy_cli, google_api, local_serving) */
  readonly provider: string
  /** 호출 모델명 */
  readonly model_name: string
  /** 실행 프로토콜 */
  readonly execution_protocol: ExecutionProtocol
  /** 시도 결과 상태 */
  readonly status: SpanStatus
  /** 해당 시도 소요 시간 (밀리초) */
  readonly latency_ms: number
  /** 전송된 프롬프트 전문 */
  readonly request_prompt: string
  /** 전송된 프롬프트 요약 (하위 호환) */
  readonly request_prompt_snippet: string
  /** 모델이 반환한 원문 텍스트 */
  readonly raw_response: string | null
  /** 실패 시 에러 상세 */
  readonly error: SpanError | null
  /** 토큰 사용량 */
  readonly usage: SpanUsage
}

/** 특정 파이프라인 단계 스냅샷 래퍼 */
export interface StageSnapshotRecord {
  /** 단계 고유 ID (예: context_build, prompt_assembly) */
  readonly stage_id: string
  /** 사용자 친화적 단계명 */
  readonly stage_name: string
  /** 스냅샷 캡처 시각 */
  readonly timestamp: string
  /** 해당 단계의 정형 도메인 데이터 */
  readonly payload: Record<string, unknown>
}

/** 스팬 + 읽기 시점 조인. */
export interface InspectorSpanView {
  /** 고유 스팬 식별자 */
  readonly span_id: string
  /** 최상위 파이프라인 실행 ID (run_id) */
  readonly trace_id: string
  /** 직속 부모 스팬 ID */
  readonly parent_span_id: string | null
  /** 계층 정렬 키 (<시작시간>Z<루트ID>.<시작시간>Z<자식ID>) */
  readonly dotted_order: string
  /** 작업 논리명 */
  readonly name: string
  /** 스팬 유형 */
  readonly span_type: SpanType
  /** 스팬 상태 */
  readonly status: SpanStatus
  /** 실행 페이즈 (pre_llm, llm, post_llm) */
  readonly phase: SpanPhase | null
  /** 이용자 친화적 한글 라벨 */
  readonly display_label: string | null
  /** 이용자 관점 상세 설명 */
  readonly description: string | null
  /** 성과 한 줄 요약 뱃지 */
  readonly summary_pill: string | null
  /** 다중 노드 식별자 */
  readonly node_id: string | null
  /** 다중 노드 명칭 */
  readonly node_title: string | null
  /** 입력 파일명 또는 입력 데이터/객체/리스트명 */
  readonly data_in: string | null
  /** 출력 파일명 또는 출력 데이터/객체/리스트명 */
  readonly data_out: string | null
  /** 이 스팬이 거쳐 간 코드 지점 (module·qualname). 경로 해석은 호스트가 한다 */
  readonly sources: SpanSource[]
  /** [deprecated] 관여 파일/클래스/함수 체인 문자열. `sources` 를 쓸 것 */
  readonly data_via: string[]
  /** 시작 시각 (UTC) */
  readonly start_time: string
  /** 종료 시각 (UTC) */
  readonly end_time: string | null
  /** 입력 매개변수 */
  readonly inputs: Record<string, unknown>
  /** 산출 결과 */
  readonly outputs: Record<string, unknown> | null
  /** 실패 시 에러 정보 */
  readonly error: SpanError | null
  /** 런타임 메타데이터 */
  readonly metadata: SpanMetadata
  /** 토큰 및 성능 사용량 */
  readonly usage: SpanUsage
  /** 이 스팬에 귀속된 모델 호출 시도 목록 (원장에서 조인) */
  readonly attempts: ModelAttemptRecord[]
  /** 스팬의 실행 시간 (밀리초) */
  readonly duration_ms: number
}

/** 실행(Run) 목록 요약 정보. */
export interface RunSummary {
  readonly run_id: string
  readonly task_name: string
  readonly domain: string
  readonly workflow_name: string
  readonly workflow_label: string
  readonly target_name: string | null
  readonly doc_id: string | null
  readonly status: string
  readonly total_duration_ms: number
  readonly total_tokens: number
  readonly input_tokens: number
  readonly output_tokens: number
  readonly thinking_tokens: number
  readonly cache_read_tokens: number
  readonly cost_usd: number | null
  readonly created_at: string
  readonly primary_provider: string | null
  readonly primary_model: string | null
  readonly spans_count: number
  readonly snapshots_count: number
  readonly has_span_detail: boolean
}

/** 실행(Run)의 전체 원장 및 스냅샷 상세. */
export interface RunDetail {
  readonly meta: Record<string, unknown>
  readonly spans: InspectorSpanView[]
  readonly snapshots: StageSnapshotRecord[]
}

export interface MatrixModelInfo {
  readonly name: string
  readonly family: string
  readonly provider: string
  readonly max_input_tokens: number
  readonly max_output_tokens: number
  readonly supports_structured_schema: boolean
  readonly display_name: string
  readonly description: string
  readonly active: boolean
}

export interface MatrixResponse {
  readonly primary_provider: string
  readonly fallback_provider: string
  readonly models: MatrixModelInfo[]
}

/** 지정된 파일 및 심볼의 원본 소스 코드/프롬프트 응답. */
export interface SourceCodeResponse {
  readonly file_path: string
  readonly symbol: string | null
  readonly content: string
  readonly start_line: number
  readonly end_line: number
  readonly total_lines: number
  readonly language: string
}
