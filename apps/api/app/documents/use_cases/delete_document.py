"""문서 삭제 유스케이스 (일반 경로).

삭제가 없으면 어떤 보존정책도 실행되지 않는다. 그리고 삭제는 **연쇄**여야 한다.
문서 본문은 프롬프트를 통해 실행 기록(`data/runs/*/payloads/`)에도 실리므로,
원본만 지우고 나머지를 남기면 지운 문서의 내용이 계속 디스크에 남는다.

지우는 순서는 파생 → 원본이다. 중간에 실패해도 원본이 남아 있으면 다시 지울 수 있지만,
원본을 먼저 지우면 남은 파생물의 주인을 찾을 수 없게 된다.
"""
from __future__ import annotations

import logging

from ..ports import (
    DocumentArtifactRepository,
    DocumentCacheRepository,
    DocumentSourceRepository,
    RunArchivePort,
    WireframeArchivePort,
)

logger = logging.getLogger(__name__)


class DeleteDocumentUseCase:
    """문서와 그 문서에서 파생된 모든 것을 지운다."""

    def __init__(
        self,
        source: DocumentSourceRepository,
        artifacts: DocumentArtifactRepository,
        cache: DocumentCacheRepository,
        scaffolds: WireframeArchivePort,
        runs: RunArchivePort,
    ) -> None:
        self._source = source
        self._artifacts = artifacts
        self._cache = cache
        self._scaffolds = scaffolds
        self._runs = runs

    def execute(self, doc_id: str) -> dict[str, int | bool]:
        if self._source.get(doc_id) is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        removed_scaffolds = self._scaffolds.delete_for_document(doc_id)
        self._artifacts.delete_all(doc_id)
        self._cache.clear(doc_id)
        removed_runs = self._runs.delete_for_document(doc_id)
        removed_source = self._source.delete(doc_id)

        logger.info(
            "[DeleteDocument] %s 삭제 (scaffolds=%d, runs=%d)",
            doc_id, removed_scaffolds, removed_runs,
        )
        return {
            "deleted": removed_source,
            "scaffolds": removed_scaffolds,
            "runs": removed_runs,
        }
