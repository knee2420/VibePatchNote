"""Immutable segment artifact repository under the segments aggregate root."""
from __future__ import annotations

import logging
import shutil
from pathlib import Path

from app.core.storage import read_json, safe_segment, write_json

from ..models import SegmentArtifact, SegmentArtifactHead, SegmentArtifactProvenance

logger = logging.getLogger(__name__)

_ARTIFACTS = "artifacts"
_HEAD = "HEAD.json"
_PROVENANCE = "provenance.json"
_SEGMENTS = "segments.json"
_MANIFEST = "manifest.json"


class LocalSegmentRepository:
    """Persists LLM and human segment revisions without overwriting history."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def commit(self, artifact: SegmentArtifact, *, set_head: bool = True) -> SegmentArtifactProvenance:
        provenance = artifact.provenance
        target = self._artifact_dir(artifact.provenance.doc_id, provenance.artifact_id)
        if (target / _PROVENANCE).exists():
            raise FileExistsError(f"Segment artifact already exists: {provenance.artifact_id}")

        target.mkdir(parents=True, exist_ok=True)
        write_json(target / _SEGMENTS, [item.model_dump(by_alias=True) for item in artifact.segments])
        write_json(
            target / _MANIFEST,
            {
                "documentTitle": artifact.document_title,
                "totalPages": artifact.total_pages,
            },
        )
        write_json(target / _PROVENANCE, provenance.model_dump(mode="json", by_alias=True))
        if set_head:
            write_json(
                self._artifacts_dir(provenance.doc_id) / _HEAD,
                SegmentArtifactHead(artifactId=provenance.artifact_id).model_dump(mode="json", by_alias=True),
            )
        logger.info("[Segments] committed artifact %s for %s", provenance.artifact_id, provenance.doc_id)
        return provenance

    def load_head(self, doc_id: str) -> SegmentArtifact | None:
        raw = read_json(self._artifacts_dir(doc_id) / _HEAD)
        if not isinstance(raw, dict):
            return None
        try:
            artifact_id = SegmentArtifactHead.model_validate(raw).artifact_id
        except ValueError:
            return None
        return self._load(doc_id, artifact_id)

    def head_id(self, doc_id: str) -> str | None:
        raw = read_json(self._artifacts_dir(doc_id) / _HEAD)
        if not isinstance(raw, dict):
            return None
        try:
            return SegmentArtifactHead.model_validate(raw).artifact_id
        except ValueError:
            return None

    def list_versions(self, doc_id: str) -> list[SegmentArtifactProvenance]:
        root = self._artifacts_dir(doc_id)
        if not root.exists():
            return []
        versions: list[SegmentArtifactProvenance] = []
        for directory in root.iterdir():
            if not directory.is_dir():
                continue
            raw = read_json(directory / _PROVENANCE)
            if not isinstance(raw, dict):
                continue
            try:
                versions.append(SegmentArtifactProvenance.model_validate(raw))
            except ValueError:
                logger.warning("[Segments] invalid provenance ignored: %s", directory.name)
        return sorted(versions, key=lambda item: item.created_at, reverse=True)

    def delete_for_document(self, doc_id: str) -> None:
        target = self._doc_dir(doc_id)
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)

    def _load(self, doc_id: str, artifact_id: str) -> SegmentArtifact | None:
        target = self._artifact_dir(doc_id, artifact_id)
        provenance = read_json(target / _PROVENANCE)
        manifest = read_json(target / _MANIFEST)
        segments = read_json(target / _SEGMENTS)
        if not isinstance(provenance, dict) or not isinstance(segments, list):
            return None
        # v5 migrated legacy document-owned artifacts. Their payload did not
        # carry a manifest, so preserve the revision and supply neutral display
        # metadata until a new segment extraction or edit writes the rich form.
        if not isinstance(manifest, dict):
            manifest = {}
        try:
            return SegmentArtifact.model_validate(
                {
                    "provenance": provenance,
                    "documentTitle": manifest.get("documentTitle", "document"),
                    "totalPages": manifest.get("totalPages", 1),
                    "segments": segments,
                }
            )
        except ValueError:
            logger.warning("[Segments] invalid artifact ignored: %s", target)
            return None

    def _doc_dir(self, doc_id: str) -> Path:
        return self._root / safe_segment(doc_id)

    def _artifact_dir(self, doc_id: str, artifact_id: str) -> Path:
        return self._artifacts_dir(doc_id) / safe_segment(artifact_id)

    def _artifacts_dir(self, doc_id: str) -> Path:
        return self._doc_dir(doc_id) / _ARTIFACTS
