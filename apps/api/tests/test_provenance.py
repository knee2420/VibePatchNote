"""아티팩트는 불변이고, 출처 없이는 존재하지 않는다.

LLM 산출물은 재현되지 않으므로 "무엇이 어떤 조건으로 만들었는가"가 결과와 함께
남아야 한다. 그것이 없으면 모델·프롬프트를 바꿨을 때 품질 변화의 원인을 특정할 수 없다.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.core.storage import StorageRoots
from app.documents.adapters import LocalDocumentArtifactRepository
from app.documents.models import ArtifactProvenance


@pytest.fixture()
def artifacts(tmp_path: Path) -> LocalDocumentArtifactRepository:
    roots = StorageRoots(tmp_path)
    roots.ensure()
    return LocalDocumentArtifactRepository(roots.knowledge_of("documents"))


def _provenance(artifact_id: str) -> ArtifactProvenance:
    return ArtifactProvenance(
        artifact_id=artifact_id,
        kind="outline",
        doc_id="doc-1",
        run_id="run-1",
        trace_id="tr-1",
        model="gemini-3.8-flash-low",
        prompt_hash="abc123",
        engine_version="0.1.0",
        summary={"totalOutlines": 3},
    )


def test_every_artifact_carries_provenance(artifacts: LocalDocumentArtifactRepository) -> None:
    artifacts.commit("doc-1", "outline", {"tree.json": {"outlines": []}}, _provenance("art-1"))

    loaded = artifacts.load_head("doc-1", "outline")
    assert loaded is not None
    provenance = loaded["provenance"]
    assert provenance["model"] == "gemini-3.8-flash-low"
    assert provenance["promptHash"] == "abc123"
    assert provenance["engineVersion"] == "0.1.0"
    assert provenance["runId"] == "run-1"


def test_committed_artifact_is_immutable(artifacts: LocalDocumentArtifactRepository) -> None:
    artifacts.commit("doc-1", "outline", {"tree.json": {"outlines": []}}, _provenance("art-1"))

    with pytest.raises(FileExistsError):
        artifacts.commit("doc-1", "outline", {"tree.json": {"outlines": [1]}}, _provenance("art-1"))


def test_reanalysis_stacks_a_version_and_moves_head(
    artifacts: LocalDocumentArtifactRepository,
) -> None:
    """재분석은 덮어쓰지 않는다. 새 버전을 쌓고 HEAD 만 옮긴다."""
    artifacts.commit("doc-1", "outline", {"tree.json": {"outlines": []}}, _provenance("art-1"))
    artifacts.commit("doc-1", "outline", {"tree.json": {"outlines": [1]}}, _provenance("art-2"))

    assert artifacts.head_id("doc-1", "outline") == "art-2"
    assert {version.artifact_id for version in artifacts.list_versions("doc-1", "outline")} == {
        "art-1",
        "art-2",
    }
    # 이전 결과가 그대로 남아 있어야 비교가 가능하다.
    previous = artifacts.load("doc-1", "outline", "art-1")
    assert previous is not None
    assert previous["tree.json"]["outlines"] == []


def test_head_can_be_left_alone(artifacts: LocalDocumentArtifactRepository) -> None:
    """실험 결과를 채택하지 않고 쌓아 두기만 할 수 있어야 한다."""
    artifacts.commit("doc-1", "outline", {"tree.json": {}}, _provenance("art-1"))
    artifacts.commit(
        "doc-1", "outline", {"tree.json": {}}, _provenance("art-2"), set_head=False
    )
    assert artifacts.head_id("doc-1", "outline") == "art-1"
