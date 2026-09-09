"""로컬 파일 기반 문서 분석 결과 저장소 어댑터."""
from __future__ import annotations

from typing import Any

from app.core.storage.document_storage import DocumentStorageManager
from app.documents.storage import OutlineStorageRepository
from scaffold_engine import OutlineDocument


class LocalDocumentAnalysisRepository:
    """기존 통합 문서 패키지 형식을 DocumentAnalysisRepository로 감싼다."""

    def __init__(
        self,
        outline_repository: OutlineStorageRepository,
        document_store: DocumentStorageManager,
    ) -> None:
        self._outline_repository = outline_repository
        self._document_store = document_store

    def outline_exists(self, filename: str) -> bool:
        return self._outline_repository.exists(filename)

    def load_outline(self, filename: str) -> dict[str, Any] | None:
        return self._outline_repository.load(filename)

    def save_outline(self, filename: str, document: OutlineDocument) -> None:
        self._outline_repository.save_outline_document(filename, document)

    def load_segment_scan(self, filename: str) -> dict[str, Any] | None:
        return self._document_store.get_package(filename).segments.load()

    def save_segment_scan(self, filename: str, payload: dict[str, Any]) -> None:
        self._document_store.get_package(filename).segments.save(payload)
