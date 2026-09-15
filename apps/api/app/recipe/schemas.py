from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .models import RecipeRevision, RecipeSourceAnchors


class CreateRecipeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str = ""
    spec: dict[str, Any] = Field(default_factory=dict)
    source_anchors: RecipeSourceAnchors = Field(default_factory=RecipeSourceAnchors, alias="sourceAnchors")


class SaveRecipeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    base_revision_id: str = Field(alias="baseRevisionId")
    title: str = ""
    spec: dict[str, Any] = Field(default_factory=dict)


class RecipeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    recipe: RecipeRevision


class RecipeRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    doc_id: str = Field(alias="docId")
    scaffold_id: str | None = Field(default=None, alias="scaffoldId")
