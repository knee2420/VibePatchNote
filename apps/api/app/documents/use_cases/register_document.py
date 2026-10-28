"""문서 등록 유스케이스 (일반 경로).

LLM 이 개입하지 않으므로 Agent Runtime 을 쓰지 않는다.
"""
from __future__ import annotations

from ..models import DocumentMeta
from ..ports import DocumentSourceRepository


class RegisterDocumentUseCase:
    """업로드된 원본을 패키지로 받아들이고 식별자를 발급한다."""

    def __init__(self, source: DocumentSourceRepository) -> None:
        self._source = source

    def execute(self, filename: str, content: bytes) -> DocumentMeta:
        return self._source.save(filename, content)
