"""독립 문서 엔진(scaffold_engine)의 OutlinePipeline 실행 어댑터."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from scaffold_engine import OutlineDocument, OutlinePipeline

from app.core.llm import BaseLlmHarness

from ..ports import DocumentCacheRepository

logger = logging.getLogger(__name__)


class EngineOutlineExtractAdapter:
    """`OutlineExtractPort` 계약의 scaffold_engine 구현체."""

    def __init__(
        self,
        harness: BaseLlmHarness,
        cache: DocumentCacheRepository,
    ) -> None:
        self._harness = harness
        self._cache = cache

    async def extract(
        self,
        file_path: Path,
        *,
        doc_id: str | None = None,
        context_dir: Path | None = None,
        display_name: str | None = None,
    ) -> OutlineDocument:
        pipeline = OutlinePipeline(harness=self._harness, default_model=self._harness.model)
        target_context_dir = context_dir
        if target_context_dir is None and doc_id:
            target_context_dir = self._cache.context_dir(doc_id)

        return await asyncio.to_thread(
            pipeline.run, file_path, context_dir=target_context_dir, display_name=display_name
        )
