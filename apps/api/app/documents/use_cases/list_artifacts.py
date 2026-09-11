"""아티팩트 이력 조회 유스케이스 (일반 경로).

같은 문서를 여러 번 분석하면 산출물이 쌓인다. 어느 것이 현재 채택본이고 그 앞에
무엇이 있었는지는 디스크가 알고 있어야 한다 — 프런트 노드가 그 지식을 독점하면
노드를 잃는 순간 판정할 수 없게 된다.
"""
from __future__ import annotations

from typing import Any

from ..models import OUTLINE_ELEMENTS_FILE, OUTLINE_TREE_FILE, ArtifactKind
from ..ports import DocumentArtifactRepository, DocumentSourceRepository

KINDS: tuple[ArtifactKind, ...] = ("outline", "segments")


class ListDocumentArtifactsUseCase:
    """문서별 아티팩트 이력과 현재 채택본을 돌려준다."""

    def __init__(
        self,
        source: DocumentSourceRepository,
        artifacts: DocumentArtifactRepository,
    ) -> None:
        self._source = source
        self._artifacts = artifacts

    def execute(self, doc_id: str) -> dict[str, Any]:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        kinds: dict[str, Any] = {}
        for kind in KINDS:
            kinds[kind] = {
                "head": self._usable_head_id(doc_id, kind),
                "versions": [
                    provenance.model_dump(mode="json", by_alias=True)
                    for provenance in self._artifacts.list_versions(doc_id, kind)
                ],
            }
        return {
            "docId": doc_id,
            "title": meta.original_name,
            "artifacts": kinds,
        }

    def list_documents(self) -> list[dict[str, Any]]:
        return [
            {
                "docId": meta.doc_id,
                "title": meta.original_name,
                "mime": meta.mime,
                "size": meta.size,
                "uploadedAt": meta.uploaded_at.isoformat(),
                "outlineArtifactId": self._usable_head_id(meta.doc_id, "outline"),
            }
            for meta in self._source.list_all()
        ]

    def _usable_head_id(self, doc_id: str, kind: ArtifactKind) -> str | None:
        head_id = self._artifacts.head_id(doc_id, kind)
        if head_id is None or kind != "outline":
            return head_id

        adopted = self._artifacts.load_head(doc_id, kind)
        if adopted is None:
            return None
        tree = adopted.get(OUTLINE_TREE_FILE) or {}
        if not tree.get("outlines") or not adopted.get(OUTLINE_ELEMENTS_FILE):
            return None
        return head_id
