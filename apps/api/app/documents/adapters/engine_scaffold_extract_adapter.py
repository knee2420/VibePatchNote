"""scaffold-engine의 ScaffoldPipeline을 documents 스캐폴드 추출 포트로 감싼다."""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from scaffold_engine import ScaffoldExtractResult, ScaffoldPipeline

from app.core.llm import BaseLlmHarness


class EngineScaffoldExtractAdapter:
    """`ScaffoldExtractPort` 구현체.

    호스트 LLM 하네스를 ScaffoldPipeline에 바인딩하고,
    비동기 스레드 풀에서 안전하게 실행합니다.
    """

    def __init__(self, harness: BaseLlmHarness) -> None:
        self._harness = harness

    async def extract(
        self,
        file_path: Path,
        *,
        display_name: str | None = None,
    ) -> tuple[ScaffoldExtractResult, Any]:
        """독립 문서 엔진(scaffold_engine)의 ScaffoldPipeline을 스레드 풀에서 실행합니다."""
        pipeline = ScaffoldPipeline(harness=self._harness)
        result = await asyncio.to_thread(
            pipeline.run, file_path, display_name=display_name
        )
        return result, pipeline.last_telemetry
