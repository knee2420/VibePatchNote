from typing import List, Optional

from pydantic import BaseModel, Field

from agent_telemetry.contracts.enums import ExecutionProtocol, SpanStatus
from agent_telemetry.contracts.metadata import SpanError
from agent_telemetry.contracts.usage import SpanUsage


class ModelAttemptRecord(BaseModel):
    """단일 LLM 호출 시도 기록 (Fallback 체인 내부 요소)"""
    attempt_index: int = Field(..., description="시도 순번 (1부터 시작)")
    provider: str = Field(..., description="공급자 (agy_cli, google_api, local_serving)")
    model_name: str = Field(..., description="호출 모델명")
    execution_protocol: ExecutionProtocol = Field(ExecutionProtocol.CLI_SUBPROCESS, description="실행 프로토콜")

    status: SpanStatus = Field(SpanStatus.PENDING, description="시도 결과 상태")
    latency_ms: float = Field(0.0, description="해당 시도 소요 시간 (밀리초)")

    request_prompt: str = Field("", description="전송된 프롬프트 전문")
    request_prompt_snippet: str = Field("", description="전송된 프롬프트 요약 (하위 호환)")
    raw_response: Optional[str] = Field(None, description="모델이 반환한 원문 텍스트")
    error: Optional[SpanError] = Field(None, description="실패 시 에러 상세")

    usage: SpanUsage = Field(default_factory=SpanUsage, description="토큰 사용량")


class FallbackChainSummary(BaseModel):
    """복수 시도에 대한 집계 컨테이너"""
    primary_provider: str = Field(..., description="1순위 지정 공급자")
    fallback_providers: List[str] = Field(default_factory=list, description="후순위 예비 공급자 목록")
    total_attempts: int = Field(1, description="실제 수행된 총 시도 횟수")
    successful_attempt_index: Optional[int] = Field(None, description="최종 성공한 시도 인덱스")
    attempts: List[ModelAttemptRecord] = Field(default_factory=list, description="시도 상세 목록")
