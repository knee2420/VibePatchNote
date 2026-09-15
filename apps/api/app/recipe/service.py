"""Recipe use-case boundary. Saves always append a revision then move HEAD."""
from __future__ import annotations

from app.core.storage import ARTIFACT_PREFIX, new_id

from .models import RecipeProvenance, RecipeRevision, RecipeSourceAnchors
from .ports import RecipeRepository


class RecipeNotFoundError(LookupError):
    pass


class RecipeRevisionConflictError(ValueError):
    def __init__(self, recipe_id: str, current_revision_id: str | None) -> None:
        super().__init__(f"Recipe revision is stale: {recipe_id}")
        self.current_revision_id = current_revision_id


class RecipeService:
    def __init__(self, repository: RecipeRepository) -> None:
        self._repository = repository

    def create(self, *, title: str, spec: dict, source_anchors: RecipeSourceAnchors) -> RecipeRevision:
        recipe_id = new_id("recipe")
        return self._repository.commit(RecipeRevision(
            provenance=RecipeProvenance(recipeId=recipe_id, revisionId=new_id(ARTIFACT_PREFIX), sourceAnchors=source_anchors),
            title=title, spec=spec,
        ))

    def get(self, recipe_id: str) -> RecipeRevision:
        recipe = self._repository.load_head(recipe_id)
        if recipe is None:
            raise RecipeNotFoundError(f"Recipe not found: {recipe_id}")
        return recipe

    def save_revision(self, recipe_id: str, *, base_revision_id: str, title: str, spec: dict) -> RecipeRevision:
        current = self.get(recipe_id)
        if current.provenance.revision_id != base_revision_id:
            raise RecipeRevisionConflictError(recipe_id, current.provenance.revision_id)
        return self._repository.commit(RecipeRevision(
            provenance=RecipeProvenance(
                recipeId=recipe_id, revisionId=new_id(ARTIFACT_PREFIX),
                sourceAnchors=current.provenance.source_anchors,
            ), title=title, spec=spec,
        ))

    def list_for_scaffold(self, scaffold_id: str) -> list[RecipeRevision]:
        return self._repository.list_for_scaffold(scaffold_id)

    def list_for_document(self, doc_id: str) -> list[RecipeRevision]:
        return self._repository.list_for_document(doc_id)
