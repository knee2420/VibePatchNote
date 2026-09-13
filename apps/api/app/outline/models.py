"""outline 도메인의 프레임워크 독립 모델.

문서 목차/엘리먼트 계층 구조 및 아티팩트 커밋 모델을 정의합니다.
"""
from datetime import datetime, timezone
from typing import Any

from agent_runtime import RunCost
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from scaffold_engine import ElementItem, OutlineNode

# outline 아티팩트 내부 파일명의 도메인 정본
OUTLINE_TREE_FILE = "tree.json"
OUTLINE_ELEMENTS_FILE = "elements.json"
OUTLINE_MARKDOWN_FILE = "outline.md"
OUTLINE_KIND = "outline"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ArtifactProvenance(BaseModel):
    """산출물 한 건을 만든 조건. 산출물과 같은 디렉터리에 나란히 둔다."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    artifact_id: str
    kind: str
    doc_id: str
    created_at: datetime = Field(default_factory=_utc_now)
    status: str = "SUCCESS"
    run_id: str | None = None
    trace_id: str | None = None
    model: str = ""
    effort: str | None = None
    prompt_hash: str | None = None
    schema_hash: str | None = None
    engine_version: str | None = None
    cost: RunCost = Field(default_factory=RunCost)
    summary: dict[str, Any] = Field(default_factory=dict)


class OutlineTreeContent(BaseModel):
    """`tree.json` 아티팩트의 스키마."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    document_title: str = Field(description="문서 원본 파일명")
    total_pages: int = Field(default=1, description="문서 총 페이지 수")
    outlines: list[OutlineNode] = Field(default_factory=list, description="계층형 목차 트리")


class OutlineArtifactFiles(BaseModel):
    """outline 아티팩트 디렉터리에 커밋되는 표준 파일 묶음 (`tree.json`, `elements.json`, `outline.md`)."""

    tree: OutlineTreeContent
    elements: list[ElementItem] = Field(default_factory=list)
    markdown: str = ""

    def to_commit_dict(self) -> dict[str, Any]:
        """저장소에 전달할 파일 맵 생성."""
        return {
            OUTLINE_TREE_FILE: self.tree.model_dump(by_alias=True),
            OUTLINE_ELEMENTS_FILE: [
                item.model_dump(by_alias=True) if hasattr(item, "model_dump") else item
                for item in self.elements
            ],
            OUTLINE_MARKDOWN_FILE: self.markdown or "",
        }


class OutlineExecutionResult(BaseModel):
    """아웃라인 추출 UseCase의 도메인 실행 결과 모델."""

    model_config = ConfigDict(populate_by_name=True)

    status: str = "completed"
    doc_id: str = Field(alias="docId")
    document_title: str
    total_pages: int = 1
    total_outlines: int = 0
    total_elements: int = 0
    outlines: list[OutlineNode] = Field(default_factory=list)
    elements: list[ElementItem] = Field(default_factory=list)
    markdown_outline: str = ""
    manifest: dict[str, Any] = Field(default_factory=dict)
    artifact_id: str | None = Field(default=None, alias="artifactId")
    trace_id: str | None = Field(default=None, alias="traceId")
    agent_run_id: str | None = Field(default=None, alias="agentRunId")
    error: Any = None

    def to_dict(self) -> dict[str, Any]:
        """기존 딕셔너리 반환 규격 호환 직렬화."""
        return self.model_dump(by_alias=True)
