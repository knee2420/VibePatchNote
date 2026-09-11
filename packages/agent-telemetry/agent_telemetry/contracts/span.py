from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, computed_field
from agent_telemetry.contracts.enums import SpanPhase, SpanStatus, SpanType
from agent_telemetry.contracts.metadata import SpanError, SpanMetadata
from agent_telemetry.contracts.usage import SpanUsage


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SpanRecord(BaseModel):
    """단일 실행 스팬 모델 (LangSmith Run 호환)"""
    span_id: str = Field(..., description="고유 스팬 식별자")
    trace_id: str = Field(..., description="최상위 파이프라인 실행 ID (run_id)")
    parent_span_id: Optional[str] = Field(None, description="직속 부모 스팬 ID")
    dotted_order: str = Field(..., description="계층 정렬 키 (<시작시간>Z<루트ID>.<시작시간>Z<자식ID>)")
    name: str = Field(..., description="작업 논리명")
    span_type: SpanType = Field(SpanType.CHAIN, description="스팬 유형")
    status: SpanStatus = Field(SpanStatus.PENDING, description="스팬 상태")

    phase: Optional[SpanPhase] = Field(None, description="실행 페이즈 (pre_llm, llm, post_llm)")
    display_label: Optional[str] = Field(None, description="이용자 친화적 한글 라벨")
    description: Optional[str] = Field(None, description="이용자 관점 상세 설명")
    summary_pill: Optional[str] = Field(None, description="성과 한 줄 요약 뱃지")
    node_id: Optional[str] = Field(None, description="다중 노드 식별자")
    node_title: Optional[str] = Field(None, description="다중 노드 명칭")

    data_in: Optional[str] = Field(None, description="입력 파일명 또는 입력 데이터/객체/리스트명")
    data_out: Optional[str] = Field(None, description="출력 파일명 또는 출력 데이터/객체/리스트명")
    data_via: List[str] = Field(default_factory=list, description="관여 파일/클래스/함수 체인 목록")

    start_time: datetime = Field(default_factory=_utc_now, description="시작 시각 (UTC)")
    end_time: Optional[datetime] = Field(None, description="종료 시각 (UTC)")

    inputs: Dict[str, Any] = Field(default_factory=dict, description="입력 매개변수")
    outputs: Optional[Dict[str, Any]] = Field(None, description="산출 결과")
    error: Optional[SpanError] = Field(None, description="실패 시 에러 정보")

    metadata: SpanMetadata = Field(default_factory=SpanMetadata, description="런타임 메타데이터")
    usage: SpanUsage = Field(default_factory=SpanUsage, description="토큰 및 성능 사용량")

    @computed_field
    @property
    def duration_ms(self) -> float:
        """스팬의 실행 시간 (밀리초)"""
        if self.end_time and self.start_time:
            return round((self.end_time - self.start_time).total_seconds() * 1000.0, 2)
        return 0.0
