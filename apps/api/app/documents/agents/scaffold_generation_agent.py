"""스캐폴드 생성 Agent 정의.

아웃라인과 마찬가지로 LLM 이 개입하는 실행이므로 Agent Runtime 을 통과한다.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from scaffold_engine import ScaffoldExtractResult, ScaffoldPipeline
from scaffold_engine.harness import BaseLlmHarness


class ScaffoldGenerationAgent:
    name = "documents.scaffold-generation"

    def __init__(self, harness: BaseLlmHarness) -> None:
        self._harness = harness

    async def generate(self, file_path: Path) -> ScaffoldExtractResult:
        pipeline = ScaffoldPipeline(harness=self._harness)
        return await asyncio.to_thread(pipeline.run, file_path)
