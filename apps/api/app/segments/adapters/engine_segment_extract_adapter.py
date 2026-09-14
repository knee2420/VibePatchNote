"""Adapter from scaffold-engine's host-independent SegmentPipeline."""
from __future__ import annotations

import asyncio
from pathlib import Path

from scaffold_engine import SegmentPipeline

from ..models import SegmentExtraction


class EngineSegmentExtractAdapter:
    def __init__(self, pipeline: SegmentPipeline) -> None:
        self._pipeline = pipeline

    async def extract(self, file_path: Path, *, display_name: str) -> SegmentExtraction:
        extracted = await asyncio.to_thread(
            self._pipeline.extract,
            file_path,
            display_name=display_name,
        )
        return SegmentExtraction(
            documentTitle=extracted.document_title,
            totalPages=extracted.total_pages,
            segments=[item.model_dump(by_alias=True) for item in extracted.segments],
        )
