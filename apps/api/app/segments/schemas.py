"""HTTP request and response contracts for the segments aggregate."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from .models import (
    DocumentSegment,
    SegmentArtifact,
    SegmentMappingItem,
    StructureTarget,
)


class SegmentRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    doc_id: str = Field(alias="docId", min_length=1)


class SegmentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str = "completed"
    doc_id: str = Field(alias="docId")
    document_title: str = Field(alias="documentTitle")
    total_pages: int = Field(alias="totalPages")
    artifact_id: str | None = Field(default=None, alias="artifactId")
    segments: list[DocumentSegment] = Field(default_factory=list)
    agent_run_id: str | None = Field(default=None, alias="agentRunId")


class SegmentRevisionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    base_artifact_id: str | None = Field(alias="baseArtifactId")
    segments: list[DocumentSegment] = Field(default_factory=list)


class RelationshipOverrideRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    target_kind: Literal["outline_element", "wireframe_block"] = Field(alias="targetKind")
    target_id: str = Field(alias="targetId", min_length=1)
    primary_segment_id: str | None = Field(default=None, alias="primarySegmentId")


class RelationshipOverrideResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agreement_id: str = Field(alias="agreementId")
    doc_id: str = Field(alias="docId")
    target_kind: str = Field(alias="targetKind")
    target_id: str = Field(alias="targetId")
    primary_segment_id: str | None = Field(default=None, alias="primarySegmentId")


class SegmentStructureResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    doc_id: str = Field(alias="docId")
    segment_artifact_id: str | None = Field(default=None, alias="segmentArtifactId")
    outline_artifact_id: str | None = Field(default=None, alias="outlineArtifactId")
    segments: list[DocumentSegment] = Field(default_factory=list)
    outline_elements: list[StructureTarget] = Field(default_factory=list, alias="outlineElements")
    wireframe_blocks: list[StructureTarget] = Field(default_factory=list, alias="wireframeBlocks")
    mappings: list[SegmentMappingItem] = Field(default_factory=list)
    stale_override_ids: list[str] = Field(default_factory=list, alias="staleOverrideIds")
    mapping_engine_version: str = Field(alias="mappingEngineVersion")


def to_segment_response(artifact: SegmentArtifact) -> SegmentResponse:
    """채택본 하나를 HTTP 응답 모양으로 옮긴다.

    라우터·서비스·재개 핸들러가 같은 모양을 내보내야 하므로 변환은 여기 한 곳이다.
    """
    return SegmentResponse(
        docId=artifact.provenance.doc_id,
        documentTitle=artifact.document_title,
        totalPages=artifact.total_pages,
        artifactId=artifact.provenance.artifact_id,
        segments=artifact.segments,
        agentRunId=artifact.provenance.run_id,
    )


def to_run_result(artifact: SegmentArtifact) -> dict[str, Any]:
    """Agent Runtime 이력에 남길 JSON.

    **런타임은 dict 만 받는다**(`AgentRunEvent.result`). 도메인 객체를 그대로
    넘기면 종결 이벤트 검증에서 터지고, run 이 끝나지 않는다.
    """
    return to_segment_response(artifact).model_dump(mode="json", by_alias=True)
