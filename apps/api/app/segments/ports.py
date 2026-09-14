"""External contracts for the independent segments aggregate."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol

from .models import (
    SegmentArtifact,
    SegmentArtifactProvenance,
    SegmentExtraction,
    SegmentRelationshipOverride,
    StructureTarget,
)


class SegmentDocumentSource(Protocol):
    def get_title(self, doc_id: str) -> str | None: ...

    def resolve_file(self, doc_id: str) -> Path: ...


class SegmentExtractor(Protocol):
    async def extract(self, file_path: Path, *, display_name: str) -> SegmentExtraction: ...


class SegmentRepository(Protocol):
    def commit(
        self,
        artifact: SegmentArtifact,
        *,
        set_head: bool = True,
    ) -> SegmentArtifactProvenance: ...

    def load_head(self, doc_id: str) -> SegmentArtifact | None: ...

    def head_id(self, doc_id: str) -> str | None: ...

    def list_versions(self, doc_id: str) -> list[SegmentArtifactProvenance]: ...

    def delete_for_document(self, doc_id: str) -> None: ...


class SegmentAgreementRepository(Protocol):
    def append(self, override: SegmentRelationshipOverride) -> SegmentRelationshipOverride: ...

    def list_for_document(self, doc_id: str) -> list[SegmentRelationshipOverride]: ...

    def delete_for_document(self, doc_id: str) -> None: ...


class SegmentMappingCache(Protocol):
    def load(self, doc_id: str, fingerprint: str) -> dict | None: ...

    def save(self, doc_id: str, fingerprint: str, payload: dict) -> None: ...

    def clear(self, doc_id: str) -> None: ...


class SegmentOutlineReader(Protocol):
    def load_elements(self, doc_id: str) -> tuple[str | None, list[StructureTarget]]: ...


class SegmentWireframeReader(Protocol):
    def load_blocks(self, doc_id: str) -> list[StructureTarget]: ...


class SegmentCleanupPort(Protocol):
    def delete_for_document(self, doc_id: str) -> None: ...


class SegmentTelemetryPort(Protocol):
    def workflow_session(
        self,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
        workflow_name: str = "segments.extract",
        workflow_label: str = "문서 세그먼트 추출",
    ) -> Any: ...
