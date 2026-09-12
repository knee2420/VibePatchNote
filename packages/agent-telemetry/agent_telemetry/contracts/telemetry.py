from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from agent_telemetry.contracts.attempt import ModelAttemptRecord
from agent_telemetry.contracts.enums import SpanStatus
from agent_telemetry.contracts.snapshot import StageSnapshotRecord
from agent_telemetry.contracts.span import SpanRecord
from agent_telemetry.contracts.usage import SpanUsage


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PipelineTelemetry(BaseModel):
    """엔진이 호스트로 방출하는 완결 텔레메트리 계약 패키지"""
    pipeline_name: str = Field(..., description="파이프라인 명칭")
    trace_id: str = Field(..., description="파이프라인 실행 ID (run_id)")
    domain: str = Field("documents", description="작업 도메인 (documents, scaffolds, novels, session 등)")
    workflow_name: str = Field("pipeline", description="비즈니스 워크플로우 식별자 (예: documents.extract_outline)")
    workflow_label: str = Field("", description="사람이 읽는 워크플로우 명칭 (예: 목차 추출, 콘티 생성 등)")
    target_name: Optional[str] = Field(None, description="작업 대상 이름 (파일명, 챕터명, 세션명 등)")
    status: SpanStatus = Field(SpanStatus.PENDING, description="전체 실행 상태")
    start_time: datetime = Field(default_factory=_utc_now, description="시작 시각")
    end_time: Optional[datetime] = Field(None, description="종료 시각")
    total_latency_ms: float = Field(0.0, description="총 소요 시간 (밀리초)")
    total_usage: SpanUsage = Field(default_factory=SpanUsage, description="전체 합산 토큰/사용량")
    provenance: Dict[str, Any] = Field(default_factory=dict, description="엔진 계보 정보")
    spans: List[SpanRecord] = Field(default_factory=list, description="실행된 모든 스팬 리스트")
    attempts: List[ModelAttemptRecord] = Field(default_factory=list, description="LLM 호출 시도 목록")
    snapshots: List[StageSnapshotRecord] = Field(default_factory=list, description="단계별 중간 스냅샷")
