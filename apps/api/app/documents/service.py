"""documents 도메인의 진입점 서비스.

비즈니스 로직은 `use_cases/` 및 `experimental/` 이 갖는다. 이 계층이 하는 일은:
1. 요청이 준 식별자(`docId` 또는 레거시 `filename`)를 `doc_id` 로 정규화한다.
2. 알맞은 유스케이스로 위임한다.
세그먼트 분석은 독립 `segments` 도메인의 책임이다. 문서 서비스는 원본과
문서 자체의 아티팩트만 소유한다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .models import DocumentMeta
from .use_cases import (
    DeleteDocumentUseCase,
    GetDocumentFileUseCase,
    ListDocumentArtifactsUseCase,
    RegisterDocumentUseCase,
)


class DocumentService:
    """라우터와 문서 유스케이스 사이의 경계 서비스."""

    def __init__(
        self,
        register: RegisterDocumentUseCase,
        get_file: GetDocumentFileUseCase,
        delete: DeleteDocumentUseCase,
        artifacts: ListDocumentArtifactsUseCase,
    ) -> None:
        self._register = register
        self._get_file = get_file
        self._delete = delete
        self._artifacts = artifacts

    # --- 원본 문서 관리 ---------------------------------------------------

    def register_upload(self, filename: str, content: bytes) -> DocumentMeta:
        return self._register.execute(filename, content)

    def get_file_by_id(self, doc_id: str) -> tuple[Path, DocumentMeta]:
        return self._get_file.by_id(doc_id)

    def get_file_by_name(self, filename: str) -> tuple[Path, DocumentMeta]:
        return self._get_file.by_name(filename)

    def resolve_doc_id(self, doc_id: str | None, filename: str | None) -> str:
        return self._get_file.resolve_id(doc_id, filename)

    def delete_document(self, doc_id: str) -> dict[str, Any]:
        return self._delete.execute(doc_id)

    def list_documents(self) -> list[dict[str, Any]]:
        return self._artifacts.list_documents()

    def list_artifacts(self, doc_id: str) -> dict[str, Any]:
        return self._artifacts.execute(doc_id)
