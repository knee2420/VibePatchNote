"""수명주기 등급이 실제로 지켜지는지 검증한다.

문서로만 있는 규칙은 지켜지지 않는다. XDG 조항을 그대로 테스트로 옮겨 둔다.

    cache/  지워도 재계산으로 복구된다  (그래서 LLM 호출 없이 다시 만들어져야 한다)
    state/  지워도 앱이 정상 동작한다
    data/   지우면 복구 불가            (그래서 위 둘을 지워도 남아 있어야 한다)
"""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from app.core.storage import STORAGE_VERSION, StorageRoots, safe_segment
from app.documents.adapters import (
    LocalDocumentArtifactRepository,
    LocalDocumentCacheRepository,
    LocalDocumentSourceRepository,
)
from app.documents.models import ArtifactProvenance


@pytest.fixture()
def roots(tmp_path: Path) -> StorageRoots:
    storage = StorageRoots(tmp_path)
    storage.ensure()
    storage.write_version(STORAGE_VERSION)
    return storage


def _seed(roots: StorageRoots) -> str:
    """원본 하나와 아티팩트 하나, 캐시 하나를 만든다."""
    source = LocalDocumentSourceRepository(roots.knowledge_of("documents"))
    artifacts = LocalDocumentArtifactRepository(roots.knowledge_of("documents"))
    cache = LocalDocumentCacheRepository(roots.cache_of("documents"))

    meta = source.save("보고서.pdf", b"%PDF-1.4 fake")
    artifacts.commit(
        meta.doc_id,
        "outline",
        {"tree.json": {"outlines": [{"id": "o1"}]}, "outline.md": "# 제목"},
        ArtifactProvenance(artifact_id="art-seed", kind="outline", doc_id=meta.doc_id),
    )
    cache.save_page_image(meta.doc_id, 1, b"fake-png")
    cache.save_geometry(meta.doc_id, {"pages": 1})
    return meta.doc_id


def test_cache_is_disposable(roots: StorageRoots) -> None:
    """cache/ 를 통째로 지워도 data/ 의 산출물은 남아 있어야 한다."""
    doc_id = _seed(roots)

    shutil.rmtree(roots.cache)
    assert not roots.cache.exists()

    artifacts = LocalDocumentArtifactRepository(roots.knowledge_of("documents"))
    adopted = artifacts.load_head(doc_id, "outline")
    assert adopted is not None
    assert adopted["tree.json"]["outlines"] == [{"id": "o1"}]

    source = LocalDocumentSourceRepository(roots.knowledge_of("documents"))
    assert source.resolve_file(doc_id).read_bytes() == b"%PDF-1.4 fake"

    # 그리고 캐시는 요청 시 다시 만들어진다. LLM 은 개입하지 않는다.
    cache = LocalDocumentCacheRepository(roots.cache_of("documents"))
    cache.save_page_image(doc_id, 1, b"fake-png")
    assert cache.get_page_image(doc_id, 1) is not None


def test_state_is_disposable(roots: StorageRoots) -> None:
    """state/ 를 지워도 등급 루트 준비만으로 되살아나야 한다."""
    doc_id = _seed(roots)
    roots.provider_state_file.write_text("{}", encoding="utf-8")

    shutil.rmtree(roots.state)
    assert not roots.state.exists()

    roots.ensure()
    assert roots.log.exists()
    assert roots.traces.exists()

    source = LocalDocumentSourceRepository(roots.knowledge_of("documents"))
    assert source.get(doc_id) is not None


def test_llm_artifacts_never_live_in_cache(roots: StorageRoots) -> None:
    """LLM 산출물이 cache/ 아래에 놓이면 안 된다. 지워도 재현되지 않기 때문이다."""
    doc_id = _seed(roots)

    committed = list((roots.cache_of("documents") / doc_id).rglob("*.json"))
    assert all(path.name != "provenance.json" for path in committed)
    assert (roots.knowledge_of("documents") / doc_id / "artifacts").exists()


def test_document_deletion_removes_every_derivative(roots: StorageRoots) -> None:
    doc_id = _seed(roots)
    source = LocalDocumentSourceRepository(roots.knowledge_of("documents"))
    artifacts = LocalDocumentArtifactRepository(roots.knowledge_of("documents"))
    cache = LocalDocumentCacheRepository(roots.cache_of("documents"))

    artifacts.delete_all(doc_id)
    cache.clear(doc_id)
    assert source.delete(doc_id) is True

    assert source.get(doc_id) is None
    assert not (roots.knowledge_of("documents") / doc_id).exists()
    assert not (roots.cache_of("documents") / doc_id).exists()


def test_identical_content_reuses_one_package(roots: StorageRoots) -> None:
    """같은 파일을 다시 올리면 분석 결과가 갈라지지 않도록 같은 패키지를 쓴다."""
    source = LocalDocumentSourceRepository(roots.knowledge_of("documents"))
    first = source.save("보고서.pdf", b"same-bytes")
    second = source.save("이름만 다른 보고서.pdf", b"same-bytes")
    assert first.doc_id == second.doc_id


def test_path_segments_reject_traversal() -> None:
    """식별자를 조용히 치환하지 않는다. 치환은 서로 다른 둘을 한 디렉터리로 합친다."""
    for bad in ("../etc", "a/b", "", ".", "..", "이름"):
        with pytest.raises(ValueError):
            safe_segment(bad)
