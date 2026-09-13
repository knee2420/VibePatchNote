"""documents 도메인의 프레임워크 독립 모델.

식별자는 `doc_id` 다. 파일명이 아니다. 파일명을 키로 쓰면 이름을 바꾼 순간 다른
문서가 되고, 서로 다른 두 파일이 같은 slug 로 충돌해도 알 수 없다.
사람이 읽는 이름은 `original_name` 에 그대로 보존한다.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from agent_runtime import RunCost
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from scaffold_engine import ElementItem, OutlineNode

# LLM 이 만들어 낸 산출물의 종류. 결정적 파생(cache/)은 여기에 오지 않는다.
ArtifactKind = Literal["outline", "segments"]

# outline 아티팩트 내부 파일명의 도메인 정본. 유스케이스마다 문자열을 복제하면
# 과거 채택본 판정과 새 아티팩트 기록 형식이 서로 어긋날 수 있다.
OUTLINE_TREE_FILE = "tree.json"
OUTLINE_ELEMENTS_FILE = "elements.json"
OUTLINE_MARKDOWN_FILE = "outline.md"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentMeta(BaseModel):
    """원본 문서 한 건. `data/knowledge/documents/{doc_id}/meta.json` 의 내용."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    doc_id: str
    original_name: str = Field(description="사용자가 올린 그대로의 파일명")
    stored_name: str = Field(description="패키지 안에 저장된 파일명")
    sha256: str = Field(description="같은 파일 재업로드를 알아보기 위한 내용 지문")
    mime: str = ""
    size: int = 0
    uploaded_at: datetime = Field(default_factory=_utc_now)

    @property
    def title(self) -> str:
        return self.original_name


class ArtifactProvenance(BaseModel):
    """산출물 한 건을 만든 조건. 산출물과 같은 디렉터리에 나란히 둔다.

    이것이 없으면 모델이나 프롬프트를 바꿨을 때 결과 차이의 원인을 특정할 수 없다.
    """

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


class ArtifactHead(BaseModel):
    """어떤 산출물이 현재 채택본인지 가리키는 포인터 (Git ref 와 같은 사상).

    같은 문서를 여러 번 분석하면 산출물이 쌓인다. 포인터가 없으면 디스크만 보고는
    어느 것이 현재본인지 알 수 없고, 프런트 노드가 그 지식을 독점하게 된다.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    artifact_id: str
    updated_at: datetime = Field(default_factory=_utc_now)


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
        """저장소 `DocumentArtifactRepository.commit`에 전달할 파일 맵 생성."""
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

