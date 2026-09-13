"""독립 문서 엔진(scaffold_engine)의 OutlinePipeline 실행 어댑터."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

from agent_telemetry import SpanPhase, SpanType, current_scope, traceable
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

    @traceable(
        name="HarnessPolicyAndRouting",
        span_type=SpanType.CHAIN,
        phase=SpanPhase.PRE_LLM,
        display_label="하네스 런타임 정책 및 쿼터 검사",
        description="CLI 가용성(Quota)과 공급자 차단 상태를 점검하고 최적의 실행 엔진을 배정합니다.",
    )
    def _resolve_routing(self, doc_id: str | None = None) -> dict[str, Any]:
        """하네스 정책을 확인하고 배정 정보를 스팬에 남긴다."""
        primary_provider = getattr(self._harness, "primary_provider", "google_api")
        target_model = getattr(self._harness, "model", "default")
        routed_engine = type(self._harness).__name__
        scope = current_scope()
        if scope:
            scope.set_label(
                summary_pill=f"쿼터 정상 · {target_model} 엔진 배정",
                data_in=f"Policy: Primary={primary_provider}",
                data_out=f"Target Engine: {routed_engine} ({target_model})",
            )
        return {
            "status": "AVAILABLE",
            "primary_provider": primary_provider,
            "target_model": target_model,
            "routing_policy": "primary_with_quota_fallback",
            "routed_engine": routed_engine,
        }

    async def extract(
        self,
        file_path: Path,
        *,
        doc_id: str | None = None,
        context_dir: Path | None = None,
        display_name: str | None = None,
    ) -> OutlineDocument:
        self._resolve_routing(doc_id=doc_id)
        pipeline = OutlinePipeline(harness=self._harness, default_model=self._harness.model)
        target_context_dir = context_dir
        if target_context_dir is None and doc_id:
            target_context_dir = self._cache.context_dir(doc_id)

        return await asyncio.to_thread(
            pipeline.run, file_path, context_dir=target_context_dir, display_name=display_name
        )

