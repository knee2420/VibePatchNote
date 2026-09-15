"""File-backed immutable Recipe revisions and HEAD pointers."""
from __future__ import annotations

from pathlib import Path

from app.core.storage import read_json, safe_segment, write_json

from ..models import RecipeHead, RecipeRevision


class LocalRecipeRepository:
    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def commit(self, revision: RecipeRevision) -> RecipeRevision:
        recipe_id = safe_segment(revision.provenance.recipe_id)
        revision_id = safe_segment(revision.provenance.revision_id)
        destination = self._root / recipe_id / "revisions" / revision_id / "recipe.json"
        if destination.exists():
            raise FileExistsError(f"Recipe revision already committed: {recipe_id}/{revision_id}")
        write_json(destination, revision.model_dump(mode="json", by_alias=True))
        write_json(
            self._root / recipe_id / "HEAD.json",
            RecipeHead(revisionId=revision_id).model_dump(mode="json", by_alias=True),
        )
        return revision

    def head_id(self, recipe_id: str) -> str | None:
        raw = read_json(self._root / safe_segment(recipe_id) / "HEAD.json")
        if not raw:
            return None
        try:
            return RecipeHead.model_validate(raw).revision_id
        except ValueError:
            return None

    def load_head(self, recipe_id: str) -> RecipeRevision | None:
        revision_id = self.head_id(recipe_id)
        if not revision_id:
            return None
        raw = read_json(self._root / safe_segment(recipe_id) / "revisions" / revision_id / "recipe.json")
        try:
            return RecipeRevision.model_validate(raw) if raw else None
        except ValueError:
            return None

    def list_for_scaffold(self, scaffold_id: str) -> list[RecipeRevision]:
        if not self._root.exists():
            return []
        recipes = [self.load_head(path.name) for path in self._root.iterdir() if path.is_dir()]
        return [recipe for recipe in recipes if recipe and recipe.provenance.source_anchors.scaffold_id == scaffold_id]

    def list_for_document(self, doc_id: str) -> list[RecipeRevision]:
        if not self._root.exists():
            return []
        recipes = [self.load_head(path.name) for path in self._root.iterdir() if path.is_dir()]
        return [recipe for recipe in recipes if recipe and recipe.provenance.source_anchors.doc_id == doc_id]
