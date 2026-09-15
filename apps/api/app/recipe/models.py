"""Independent, ID-anchored DocumentRecipe revision models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RecipeSourceAnchors(BaseModel):
    """Other aggregates are represented solely by their stable identifiers."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    doc_id: str | None = None
    segment_artifact_id: str | None = None
    outline_artifact_id: str | None = None
    scaffold_id: str | None = None
    mapping_fingerprint: str | None = None


class RecipeProvenance(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    recipe_id: str
    revision_id: str
    created_at: datetime = Field(default_factory=_now)
    origin: Literal["manual", "llm"] = "manual"
    run_id: str | None = None
    trace_id: str | None = None
    model: str | None = None
    prompt_hash: str | None = None
    engine_version: str | None = None
    source_anchors: RecipeSourceAnchors = Field(default_factory=RecipeSourceAnchors)


class RecipeRevision(BaseModel):
    """Immutable authoring specification revision; spec never holds source copies."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    provenance: RecipeProvenance
    title: str = ""
    spec: dict[str, Any] = Field(default_factory=dict)


class RecipeHead(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    revision_id: str
    updated_at: datetime = Field(default_factory=_now)


class RecipeInputSnapshot(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    doc_id: str
    document_title: str
    source_anchors: RecipeSourceAnchors
    segments: list[dict[str, Any]] = Field(default_factory=list)
    outline_elements: list[dict[str, Any]] = Field(default_factory=list)
    mappings: list[dict[str, Any]] = Field(default_factory=list)
    wireframe: dict[str, Any] = Field(default_factory=dict)
