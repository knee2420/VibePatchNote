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
        # 모델은 엔진 기본값이 아니라 주입된 하네스(= 지금 런타임 정책)의 것을 쓴다.
        # 넘기지 않으면 OutlinePipeline 이 자기 DEFAULT_MODEL 을 run_structured 에 명시적으로
        # 실어 보내 하네스의 모델을 덮어쓴다. 실행마다 한 번만 읽으므로 한 실행 안에서는
        # 실제 호출 모델과 출처(provenance)의 모델이 어긋나지 않는다.
        pipeline = OutlinePipeline(harness=self._harness, default_model=self._harness.model)
        return await asyncio.to_thread(pipeline.run, file_path, context_dir=context_dir)
