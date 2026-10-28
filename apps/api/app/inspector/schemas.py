"""인스펙터 전용 응답 스키마."""
from __future__ import annotations

from typing import Any, Optional

from agent_telemetry.contracts import (
    ModelAttemptRecord,
    SpanRecord,
    SpanSource,
    StageSnapshotRecord,
)
from pydantic import BaseModel, Field


class InspectorSpanView(SpanRecord):
    """스팬 + 읽기 시점 조인.

    `attempts` 는 원장에서 별도 이벤트(`event_type: "attempt"`)로 저장된다.
    스팬 계약에 넣지 않는 이유는 계약이 **기록 시점의 사실**만 담아야 하기
    때문이다. 다만 조회할 때는 LLM 스팬에 붙여 주는 편이 쓰기 좋으므로,
    그 조인을 암묵적으로 dict 에 밀어 넣지 않고 여기서 타입으로 선언한다.
    """

    attempts: list[ModelAttemptRecord] = Field(
        default_factory=list,
        description="이 스팬에 귀속된 모델 호출 시도 목록 (원장에서 조인)",
    )


class RunSummaryResponse(BaseModel):
    """실행(Run) 목록 요약 정보."""
    run_id: str
    task_name: str
    domain: str = "documents"
    workflow_name: str = "pipeline"
    workflow_label: str = ""
    target_name: Optional[str] = None
    doc_id: Optional[str] = None
    status: str
    total_duration_ms: float = 0.0
    # 토큰은 제품 어휘(RunCost)를 쓴다. 공급자 어휘(SpanUsage)와의 변환은
    # agent_telemetry.contracts.usage 의 함수 한 쌍만 수행한다.
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    thinking_tokens: int = 0
    cache_read_tokens: int = 0
    # 모르는 값을 0 으로 쓰지 않는다. 0 은 "무료"로 읽힌다. ModelSpec 에 단가 축이
    # 없는 한 시스템 어디에도 USD 비용은 존재하지 않는다.
    cost_usd: Optional[float] = None
    created_at: str
    primary_provider: Optional[str] = None
    primary_model: Optional[str] = None
    spans_count: int = 0
    snapshots_count: int = 0
    # 단계 상세(ledger.jsonl)의 유무. 부재는 오류가 아니라 정상 상태다 —
    # 계측되지 않은 파이프라인의 run 도 목록과 비용은 온전해야 한다.
    has_span_detail: bool = False


class RunDetailResponse(BaseModel):
    """실행(Run)의 전체 원장 및 스냅샷 상세."""
    meta: dict[str, Any]
    spans: list[InspectorSpanView] = Field(default_factory=list)
    # 계약 그대로. 납작한 딕셔너리로 만들면 stage_id 와 순서를 잃는다.
    snapshots: list[StageSnapshotRecord] = Field(default_factory=list)


class WorkflowStageInfo(BaseModel):
    """워크플로우를 이루는 단계 하나. **기록된 실행에서 도출**된다."""

    name: str = Field(description="스팬 논리명")
    display_label: str = Field("", description="사람이 읽을 이름. 파이프라인이 기록 시점에 정한다")
    description: str = Field("", description="이용자 관점 설명")
    span_type: str = Field("chain", description="스팬 유형")
    phase: Optional[str] = Field(None, description="실행 페이즈")
    seen_in_runs: int = Field(0, description="이 단계가 관측된 run 수")
    median_duration_ms: float = Field(0.0, description="소요 시간 중앙값")
    sources: list[SpanSource] = Field(default_factory=list, description="이 단계가 거쳐 간 코드 지점")


class WorkflowInfo(BaseModel):
    """시스템이 실제로 실행한 적 있는 워크플로우 하나."""

    workflow_name: str
    workflow_label: str = ""
    domain: str = "documents"
    pipeline_name: str = ""
    run_count: int = 0
    last_run_at: str = ""
    models: list[str] = Field(default_factory=list, description="이 워크플로우가 쓴 모델들")
    status_counts: dict[str, int] = Field(default_factory=dict, description="상태별 run 수")
    stages: list[WorkflowStageInfo] = Field(default_factory=list)


class MatrixModelInfo(BaseModel):
    name: str
    family: str
    provider: str
    max_input_tokens: int = 1_000_000
    max_output_tokens: int = 8_192
    supports_structured_schema: bool = True
    display_name: str = ""
    description: str = ""
    active: bool = True


class MatrixResponse(BaseModel):
    primary_provider: str
    fallback_provider: str
    models: list[MatrixModelInfo]


class SourceCodeResponse(BaseModel):
    """지정된 파일 및 심볼의 원본 소스 코드/프롬프트 응답."""
    file_path: str
    symbol: Optional[str] = None
    content: str
    start_line: int = 1
    end_line: int = 1
    total_lines: int = 1
    language: str = "python"

