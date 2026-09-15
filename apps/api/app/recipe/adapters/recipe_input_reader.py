"""Recipe-owned projection of independent source aggregates through injected ports."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from ..models import RecipeInputSnapshot, RecipeSourceAnchors


class LocalRecipeInputReader:
    def __init__(self, source: Any, segments: Any, artifacts: Any, scaffolds: Any, structure_view: Any) -> None:
        self._source, self._segments, self._artifacts = source, segments, artifacts
        self._scaffolds, self._structure_view = scaffolds, structure_view

    def readiness(
        self, doc_id: str, scaffold_id: str | None
    ) -> tuple[list[str], RecipeInputSnapshot | None]:
        missing: list[str] = []
        meta = self._source.get(doc_id)
        segment = self._segments.load_head(doc_id)
        outline_id = self._artifacts.head_id(doc_id, "outline")
        outline = self._artifacts.load_head(doc_id, "outline")
        contents = self._scaffolds.find_contents(scaffold_id) if scaffold_id else None
        if meta is None:
            missing.append("원본 문서")
        if segment is None:
            missing.append("채택된 세그먼트")
        if not outline_id or not outline:
            missing.append("채택된 아웃라인")
        if not scaffold_id or contents is None:
            missing.append("선택된 와이어프레임")
        if missing:
            return missing, None
        view = self._structure_view.execute(doc_id)
        mappings = [item.model_dump(mode="json", by_alias=True) for item in view.mappings]
        fingerprint = hashlib.sha256(json.dumps(mappings, sort_keys=True).encode()).hexdigest()[:20]
        anchors = RecipeSourceAnchors(
            docId=doc_id,
            segmentArtifactId=segment.provenance.artifact_id,
            outlineArtifactId=outline_id,
            scaffoldId=scaffold_id,
            mappingFingerprint=fingerprint,
        )
        return [], RecipeInputSnapshot(
            docId=doc_id,
            documentTitle=meta.title,
            sourceAnchors=anchors,
            segments=[item.model_dump(mode="json", by_alias=True) for item in segment.segments],
            outlineElements=list(outline.get("elements.json") or []), mappings=mappings,
            wireframe={
                "title": contents.record.title,
                "slots": [slot.model_dump() for slot in contents.slots],
            },
        )
