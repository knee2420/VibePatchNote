"""v5 — move visual segment artifacts out of the documents aggregate root."""
from __future__ import annotations

import shutil
from pathlib import Path


def run(base_dir: Path) -> None:
    documents_root = base_dir / "data" / "knowledge" / "documents"
    segments_root = base_dir / "data" / "knowledge" / "segments"
    if not documents_root.exists():
        return

    for document_dir in documents_root.iterdir():
        if not document_dir.is_dir():
            continue
        legacy = document_dir / "artifacts" / "segments"
        if not legacy.exists():
            continue
        target = segments_root / document_dir.name / "artifacts"
        if target.exists():
            raise FileExistsError(f"Segment aggregate target already exists: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(legacy), str(target))
