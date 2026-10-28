"""wireframe 도메인의 프레임워크 독립 모델."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from scaffold_engine import ScaffoldMeta, SlotMappingItem


class WireframeExecutionResult(BaseModel):
    """와이어프레임(서식 틀) 생성 UseCase의 도메인 실행 결과 모델."""

    model_config = ConfigDict(populate_by_name=True)

    status: str = "completed"
    doc_id: str = Field(alias="docId")
    meta: ScaffoldMeta
    html_content: str = Field(alias="htmlContent")
    markdown_content: str = Field(alias="markdownContent")
    slots: list[SlotMappingItem] = Field(default_factory=list)
    archive: dict[str, Any] | None = None
    manifest: dict[str, Any] = Field(default_factory=dict)
    trace_id: str | None = Field(default=None, alias="traceId")
    agent_run_id: str | None = Field(default=None, alias="agentRunId")
    error: Any = None

    def to_dict(self) -> dict[str, Any]:
        """기존 딕셔너리 반환 규격 호환 직렬화."""
        return self.model_dump(by_alias=True)


# 하위 호환성 alias
ScaffoldExecutionResult = WireframeExecutionResult
