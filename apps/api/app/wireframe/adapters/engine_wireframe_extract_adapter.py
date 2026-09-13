"""scaffold-engine의 wireframe 파이프라인 실행 어댑터."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

from agent_runtime import RunCost
from agent_telemetry import (
    SpanPhase,
    SpanType,
    SpanUsage,
    current_scope,
    traceable,
    usage_to_product_dict,
)
from scaffold_engine import ScaffoldExtractResult
from scaffold_engine.wireframe import ScaffoldPipeline

from app.core.llm import BaseLlmHarness

from ..ports import WireframeExtractOutput

logger = logging.getLogger(__name__)


class EngineWireframeExtractAdapter:
    """`WireframeExtractPort` 구현체."""

    def __init__(self, harness: BaseLlmHarness, cache: Any = None) -> None:
        self._harness = harness
        self._cache = cache

    @traceable(
        name="HarnessPolicyAndRouting",
        span_type=SpanType.CHAIN,
        phase=SpanPhase.PRE_LLM,
        display_label="하네스 런타임 정책 및 쿼터 검사",
        description="CLI 가용성(Quota)과 공급자 차단 상태를 점검하고 최적의 실행 엔진을 배정합니다.",
    )
    def _resolve_routing(self, display_name: str | None = None) -> dict[str, Any]:
        primary_provider = getattr(self._harness, "primary_provider", "google_api")
        target_model = getattr(self._harness, "model", "default")
        routed_engine = type(self._harness).__name__
        scope = current_scope()
        if scope:
            scope.set_inputs({
                "primary_provider": primary_provider,
                "target_model": target_model,
                "target_file": display_name,
                "routing_policy": "primary_with_quota_fallback",
            })
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
    ) -> WireframeExtractOutput:
        self._resolve_routing(display_name=display_name)
        pipeline = ScaffoldPipeline(harness=self._harness)
        target_context_dir = context_dir
        if target_context_dir is None and doc_id and self._cache and hasattr(self._cache, "context_dir"):
            target_context_dir = self._cache.context_dir(doc_id)

        result: ScaffoldExtractResult = await asyncio.to_thread(
            pipeline.run,
            file_path,
            display_name=display_name,
            context_dir=target_context_dir,
        )
        raw_telemetry = pipeline.last_telemetry or {}

        cost = RunCost()
        pipe_tel = (
            raw_telemetry.get("pipeline_telemetry")
            if isinstance(raw_telemetry, dict)
            else getattr(raw_telemetry, "pipeline_telemetry", None)
        )
        target_usage = None
        if pipe_tel and isinstance(pipe_tel, dict):
            target_usage = pipe_tel.get("total_usage")
        elif pipe_tel and hasattr(pipe_tel, "total_usage"):
            target_usage = pipe_tel.total_usage

        if target_usage:
            try:
                span_usage = (
                    target_usage
                    if isinstance(target_usage, SpanUsage)
                    else SpanUsage.model_validate(target_usage)
                )
                cost = RunCost(**usage_to_product_dict(span_usage))
            except Exception as e:
                logger.warning("[EngineWireframeExtractAdapter] 텔레메트리 비용 계산 실패: %s", e)

        telemetry_dict: dict[str, Any] = {}
        if hasattr(raw_telemetry, "model_dump"):
            telemetry_dict = raw_telemetry.model_dump(mode="json")
        elif isinstance(raw_telemetry, dict):
            telemetry_dict = raw_telemetry

        return WireframeExtractOutput(
            meta=result.meta,
            html_content=result.html_content,
            markdown_content=result.markdown_content,
            slots=result.slots,
            cost=cost,
            telemetry=telemetry_dict,
        )


# 하위 호환성 alias
EngineScaffoldExtractAdapter = EngineWireframeExtractAdapter
