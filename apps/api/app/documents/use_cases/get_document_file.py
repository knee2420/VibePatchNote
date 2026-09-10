"""원본 파일 조회 유스케이스 (일반 경로).

식별자로 찾는 것이 정본이고, 파일명 조회는 아직 `docId` 로 옮기지 않은
클라이언트를 위한 통로다.
"""
from __future__ import annotations

from pathlib import Path

from ..models import DocumentMeta
from ..ports import DocumentSourceRepository


class GetDocumentFileUseCase:
    """원본 파일의 실제 경로와 표시 이름을 돌려준다."""

    def __init__(self, source: DocumentSourceRepository) -> None:
        self._source = source

    def by_id(self, doc_id: str) -> tuple[Path, DocumentMeta]:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return self._source.resolve_file(doc_id), meta

    def by_name(self, filename: str) -> tuple[Path, DocumentMeta]:
        meta = self._source.find_by_name(filename)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {filename}")
        return self._source.resolve_file(meta.doc_id), meta

    def resolve_id(self, doc_id: str | None, filename: str | None) -> str:
        """요청이 준 식별자를 정규화한다.

        `docId` 가 있으면 그대로 쓰고, 없으면 파일명으로 한 번 찾아 준다.
        찾지 못하면 여기서 끝낸다 — 없는 문서를 조용히 새로 만들지 않는다.
        """
        if doc_id:
            return doc_id
        if filename:
            meta = self._source.find_by_name(filename)
            if meta is not None:
                return meta.doc_id
        raise FileNotFoundError(f"Document not found: {filename or doc_id!r}")
