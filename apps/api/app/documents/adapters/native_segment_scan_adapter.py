"""scaffold-engine의 JSON 실행기를 documents 세그먼트 분석 포트로 감싼다."""
from __future__ import annotations

import asyncio
from typing import Any

from scaffold_engine import JsonPromptRunner


class EngineSegmentScanAdapter:
    """엔진의 범용 JSON 실행을 documents 포트로 노출한다."""

    def __init__(self, runner: JsonPromptRunner) -> None:
        self._runner = runner

    async def scan(self, prompt: str) -> dict[str, Any] | None:
        return await asyncio.to_thread(self._runner.run, prompt, list_key="segments")
