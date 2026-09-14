"""Disposable deterministic mapping cache."""
from __future__ import annotations

import shutil
from pathlib import Path

from app.core.storage import read_json, safe_segment, write_json


class LocalSegmentMappingCache:
    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def load(self, doc_id: str, fingerprint: str) -> dict | None:
        raw = read_json(self._doc_dir(doc_id) / f"effective-mapping-{safe_segment(fingerprint)}.json")
        return raw if isinstance(raw, dict) else None

    def save(self, doc_id: str, fingerprint: str, payload: dict) -> None:
        write_json(self._doc_dir(doc_id) / f"effective-mapping-{safe_segment(fingerprint)}.json", payload)

    def clear(self, doc_id: str) -> None:
        target = self._doc_dir(doc_id)
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)

    def _doc_dir(self, doc_id: str) -> Path:
        return self._root / safe_segment(doc_id)
