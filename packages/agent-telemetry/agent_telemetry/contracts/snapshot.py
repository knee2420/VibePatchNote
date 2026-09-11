from datetime import datetime, timezone
from typing import Any, Dict
from pydantic import BaseModel, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class StageSnapshotRecord(BaseModel):
    """특정 파이프라인 단계 스냅샷 래퍼"""
    stage_id: str = Field(..., description="단계 고유 ID (예: context_build, prompt_assembly)")
    stage_name: str = Field(..., description="사용자 친화적 단계명")
    timestamp: datetime = Field(default_factory=_utc_now, description="스냅샷 캡처 시각")
    payload: Dict[str, Any] = Field(default_factory=dict, description="해당 단계의 정형 도메인 데이터")
