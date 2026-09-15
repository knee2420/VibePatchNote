from pathlib import Path

import pytest

from app.recipe.adapters import LocalRecipeRepository
from app.recipe.models import RecipeSourceAnchors
from app.recipe.service import RecipeRevisionConflictError, RecipeService


def test_recipe_revisions_are_immutable_and_head_moves_immediately(tmp_path: Path) -> None:
    repository = LocalRecipeRepository(tmp_path / "data" / "knowledge" / "recipes")
    service = RecipeService(repository)

    first = service.create(
        title="입력 신청서",
        spec={"blocks": [{"id": "applicant", "role": "identity"}]},
        source_anchors=RecipeSourceAnchors(
            docId="doc-1", segmentArtifactId="segment-1", outlineArtifactId="outline-1", scaffoldId="scaffold-1"
        ),
    )
    saved = service.save_revision(
        first.provenance.recipe_id,
        base_revision_id=first.provenance.revision_id,
        title="입력 신청서 v2",
        spec={"blocks": [{"id": "applicant", "role": "identity", "required": True}]},
    )

    assert saved.provenance.revision_id != first.provenance.revision_id
    assert service.get(first.provenance.recipe_id).title == "입력 신청서 v2"
    assert repository.list_for_scaffold("scaffold-1")[0].provenance.recipe_id == first.provenance.recipe_id
    assert repository.load_head(first.provenance.recipe_id).provenance.source_anchors.doc_id == "doc-1"

    with pytest.raises(RecipeRevisionConflictError):
        service.save_revision(
            first.provenance.recipe_id,
            base_revision_id=first.provenance.revision_id,
            title="stale",
            spec={},
        )


def test_recipe_storage_is_independent_from_document_root(tmp_path: Path) -> None:
    repository = LocalRecipeRepository(tmp_path / "data" / "knowledge" / "recipes")
    recipe = RecipeService(repository).create(
        title="독립 규격",
        spec={"purpose": "repeatable authoring"},
        source_anchors=RecipeSourceAnchors(docId="doc-deleted", scaffoldId="scaffold-kept"),
    )

    assert (tmp_path / "data" / "knowledge" / "recipes" / recipe.provenance.recipe_id / "HEAD.json").is_file()
    assert not (tmp_path / "data" / "knowledge" / "documents" / "doc-deleted").exists()
