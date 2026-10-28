"""Framework-independent models owned by the segments aggregate."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from agent_runtime import RunCost
from pydantic import BaseModel, ConfigDict, Field, field_validator


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentSegment(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    page: int = Field(default=1, ge=1)
    type: str
    label: str
    box_2d: list[int]
    content_summary: str | None = None
    panel_id: str | None = Field(default=None, alias="panelId")
    semantic_role: str | None = Field(default=None, alias="semanticRole")
    authoring_unit_hint: Literal["block", "element"] | None = Field(
        default=None, alias="authoringUnitHint"
    )

    @field_validator("box_2d")
    @classmethod
    def validate_box(cls, value: list[int]) -> list[int]:
        if len(value) != 4:
            raise ValueError("box_2d must contain [ymin, xmin, ymax, xmax]")
        ymin, xmin, ymax, xmax = value
        if not all(0 <= coordinate <= 1000 for coordinate in value):
            raise ValueError("box_2d values must be between 0 and 1000")
        if ymax <= ymin or xmax <= xmin:
            raise ValueError("box_2d must have a positive area")
        return value


class SegmentArtifactProvenance(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    artifact_id: str = Field(alias="artifactId")
    doc_id: str = Field(alias="docId")
    status: str = "SUCCESS"
    created_at: datetime = Field(default_factory=_utc_now, alias="createdAt")
    run_id: str | None = Field(default=None, alias="runId")
    trace_id: str | None = Field(default=None, alias="traceId")
    model: str = ""
    prompt_hash: str | None = Field(default=None, alias="promptHash")
    schema_hash: str | None = Field(default=None, alias="schemaHash")
    engine_version: str | None = Field(default=None, alias="engineVersion")
    cost: RunCost = Field(default_factory=RunCost)
    summary: dict[str, Any] = Field(default_factory=dict)


class SegmentArtifactHead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    artifact_id: str = Field(alias="artifactId")
    updated_at: datetime = Field(default_factory=_utc_now, alias="updatedAt")


class SegmentArtifact(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provenance: SegmentArtifactProvenance
    document_title: str = Field(alias="documentTitle")
    total_pages: int = Field(default=1, alias="totalPages")
    segments: list[DocumentSegment] = Field(default_factory=list)


class SegmentExtraction(BaseModel):
    """Validated engine output before the host attaches artifact provenance."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str = Field(alias="documentTitle")
    total_pages: int = Field(default=1, alias="totalPages")
    segments: list[DocumentSegment] = Field(default_factory=list)


class StructureTarget(BaseModel):
    """A foreign artifact entity referred to by identifier only."""

    id: str
    page: int = 1
    label: str
    type: str
    box_2d: list[int] | None = None
    artifact_id: str | None = Field(default=None, alias="artifactId")
    scaffold_id: str | None = Field(default=None, alias="scaffoldId")


class SegmentRelationshipOverride(BaseModel):
    """Immutable human decision about one target's primary segment."""

    model_config = ConfigDict(populate_by_name=True)

    agreement_id: str = Field(alias="agreementId")
    doc_id: str = Field(alias="docId")
    target_kind: Literal["outline_element", "wireframe_block"] = Field(alias="targetKind")
    target_id: str = Field(alias="targetId")
    primary_segment_id: str | None = Field(default=None, alias="primarySegmentId")
    segment_artifact_id: str = Field(alias="segmentArtifactId")
    outline_artifact_id: str | None = Field(default=None, alias="outlineArtifactId")
    created_at: datetime = Field(default_factory=_utc_now, alias="createdAt")
    #: 사람의 결정을 **철회**한 기록. 이력은 append-only 이므로 지우지 않고 덧붙인다.
    #: 소속 해제(`primarySegmentId=None`)와 다르다 — 그쪽은 "어디에도 속하지 않는다"는
    #: 결정이고, 이쪽은 그 결정 자체를 물러 자동 분석으로 되돌리는 것이다.
    revoked: bool = False


class SegmentMappingItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    target_kind: Literal["outline_element", "wireframe_block"] = Field(alias="targetKind")
    target_id: str = Field(alias="targetId")
    primary_segment_id: str | None = Field(default=None, alias="primarySegmentId")
    confidence: float = 0.0
    source: Literal["algorithm", "override", "unassigned"]
    reason: str = ""


class SegmentStructureView(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    doc_id: str = Field(alias="docId")
    segment_artifact_id: str | None = Field(default=None, alias="segmentArtifactId")
    outline_artifact_id: str | None = Field(default=None, alias="outlineArtifactId")
    segments: list[DocumentSegment] = Field(default_factory=list)
    outline_elements: list[StructureTarget] = Field(default_factory=list, alias="outlineElements")
    wireframe_blocks: list[StructureTarget] = Field(default_factory=list, alias="wireframeBlocks")
    mappings: list[SegmentMappingItem] = Field(default_factory=list)
    stale_override_ids: list[str] = Field(default_factory=list, alias="staleOverrideIds")
    mapping_engine_version: str = Field(default="1", alias="mappingEngineVersion")
