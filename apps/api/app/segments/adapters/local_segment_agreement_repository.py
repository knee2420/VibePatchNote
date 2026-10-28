"""Append-only human relationship decisions for segments."""
from __future__ import annotations

import shutil
from pathlib import Path

from app.core.storage import read_json, safe_segment, write_json

from ..models import SegmentRelationshipOverride


class LocalSegmentAgreementRepository:
    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def append(self, override: SegmentRelationshipOverride) -> SegmentRelationshipOverride:
        target = self._doc_dir(override.doc_id) / f"{safe_segment(override.agreement_id)}.json"
        if target.exists():
            raise FileExistsError(f"Segment agreement already exists: {override.agreement_id}")
        write_json(target, override.model_dump(mode="json", by_alias=True))
        return override

    def list_for_document(self, doc_id: str) -> list[SegmentRelationshipOverride]:
        root = self._doc_dir(doc_id)
        if not root.exists():
            return []
        values: list[SegmentRelationshipOverride] = []
        for path in root.glob("*.json"):
            raw = read_json(path)
            if not isinstance(raw, dict):
                continue
            try:
                values.append(SegmentRelationshipOverride.model_validate(raw))
            except ValueError:
                continue
        return sorted(values, key=lambda item: item.created_at)

    def delete_for_document(self, doc_id: str) -> None:
        target = self._doc_dir(doc_id)
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)

    def _doc_dir(self, doc_id: str) -> Path:
        return self._root / "segment-relations" / safe_segment(doc_id)
