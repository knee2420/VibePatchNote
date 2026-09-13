"""scaffold-engine의 ScaffoldPipeline을 documents 스캐폴드 추출 포트로 감싼다."""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from agent_telemetry import SpanPhase, SpanType, current_scope, traceable
from scaffold_engine import ScaffoldExtractResult, ScaffoldPipeline

from app.core.llm import BaseLlmHarness


class EngineScaffoldExtractAdapter:
    """`ScaffoldExtractPort` 구현체.

    호스트 LLM 하네스를 ScaffoldPipeline에 바인딩하고,
    비동기 스레드 풀에서 안전하게 실행합니다.
    """

    def __init__(self, harness: BaseLlmHarness) -> None:
        self._harness = harness

    @traceable(
        name="HarnessPolicyAndRouting",
        span_type=SpanType.CHAIN,
        phase=SpanPhase.PRE_LLM,
        display_label="하네스 런타임 정책 및 쿼터 검사",
        description="CLI 가용성(Quota)과 공급자 차단 상태를 점검하고 최적의 실행 엔진을 배정합니다.",
    )
    def _resolve_routing(self, display_name: str | None = None) -> dict[str, Any]:
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
        display_name: str | None = None,
    ) -> tuple[ScaffoldExtractResult, Any]:
        """독립 문서 엔진(scaffold_engine)의 ScaffoldPipeline을 스레드 풀에서 실행합니다."""
        self._resolve_routing(display_name=display_name)
        pipeline = ScaffoldPipeline(harness=self._harness)
        result = await asyncio.to_thread(
            pipeline.run, file_path, display_name=display_name
        )
        return result, pipeline.last_telemetry

