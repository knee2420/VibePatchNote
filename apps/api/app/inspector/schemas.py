"""인스펙터 전용 응답 스키마."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


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
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    thinking_tokens: int = 0
    cache_read_tokens: int = 0
    cost_usd: float = 0.0
    created_at: str
    primary_provider: Optional[str] = None
    primary_model: Optional[str] = None
    spans_count: int = 0
    snapshots_count: int = 0


class RunDetailResponse(BaseModel):
    """실행(Run)의 전체 원장 및 스냅샷 상세."""
    meta: dict[str, Any]
    spans: list[dict[str, Any]] = Field(default_factory=list)
    snapshots: dict[str, Any] = Field(default_factory=dict)


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
