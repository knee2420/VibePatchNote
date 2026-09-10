"""문서 도메인의 AI 작업 정의. 일반 서비스와 AI 작업을 이 경계에서 분리한다."""
from __future__ import annotations

import asyncio
from pathlib import Path

from scaffold_engine import OutlineDocument, OutlinePipeline
from scaffold_engine.harness import BaseLlmHarness


class OutlineAnalysisAgent:
    name = "documents.outline-analysis"

    def __init__(self, harness: BaseLlmHarness) -> None:
        self._harness = harness

    async def analyze(self, file_path: Path, context_dir: Path | None = None) -> OutlineDocument:
        """아웃라인을 추출한다.

        `context_dir` 은 엔진이 만들어 낼 결정적 파생(컨텍스트 마크다운)의 위치다.
        엔진이 스스로 정하면 업로드 디렉터리를 오염시키므로 호스트가 넘겨준다.
        """
        pipeline = OutlinePipeline(harness=self._harness)
        return await asyncio.to_thread(pipeline.run, file_path, context_dir=context_dir)
