from typing import Optional
from pydantic import BaseModel, Field


class SpanUsage(BaseModel):
    """토큰 소모량 및 소요 시간 집계"""
    prompt_tokens: int = Field(0, description="입력 프롬프트 토큰 수")
    completion_tokens: int = Field(0, description="출력 생성 토큰 수")
    reasoning_tokens: Optional[int] = Field(None, description="사고/추론 토큰 수")
    total_tokens: int = Field(0, description="총 토큰 수")
    latency_ms: float = Field(0.0, description="소요 시간 (밀리초)")
    estimated_cost_usd: Optional[float] = Field(None, description="예상 비용 (달러)")
