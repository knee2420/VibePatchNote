"""Structured contracts for visual document segment extraction."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SegmentItem(BaseModel):
    """One physical region on one source page.

    Coordinates deliberately remain in the existing 0..1000 page-relative
    coordinate system. Hosts can render them at any viewport size without a
    unit conversion or a source-page pixel dependency.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str
    page: int = Field(ge=1)
    type: str = "paragraph"
    label: str
    box_2d: list[int] = Field(alias="box_2d")
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
        if not all(0 <= point <= 1000 for point in value):
            raise ValueError("box_2d values must be between 0 and 1000")
        if ymax <= ymin or xmax <= xmin:
            raise ValueError("box_2d must have a positive area")
        return value


class SegmentDocument(BaseModel):
    """Validated LLM output, independent from any API or storage host."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str
    total_pages: int = Field(default=1, ge=1)
    segments: list[SegmentItem] = Field(default_factory=list)
