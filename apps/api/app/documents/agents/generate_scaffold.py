"""스캐폴드 생성 Agent (Agent 경로).

스캐폴드는 문서의 하위 구조가 아니라 자기 식별자와 수명주기를 가진 별개의
애그리거트다. 이 Agent는 `doc_id` 만 넘기고 그 안을 알지 못한다.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from agent_runtime import AgentRunInput, current_run_id
from scaffold_engine import ScaffoldExtractResult, ScaffoldPipeline

from app.core.llm import BaseLlmHarness, ingest_pipeline_telemetry

from ..ports import AgentRuntimePort, DocumentSourceRepository, ScaffoldArchivePort

logger = logging.getLogger(__name__)


class GenerateScaffoldUseCase:
    """PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 생성한다."""

    name = "documents.generate_scaffold"

    def __init__(
        self,
        source: DocumentSourceRepository,
        scaffolds: ScaffoldArchivePort,
        agent_runtime: AgentRuntimePort,
        llm_harness: BaseLlmHarness,
    ) -> None:
        self._source = source
        self._scaffolds = scaffolds
        self._runtime = agent_runtime
        self._harness = llm_harness

    async def _run_pipeline(
        self, file_path: Any, display_name: str | None = None
    ) -> tuple[ScaffoldExtractResult, Any]:
        """독립 문서 엔진(scaffold_engine)의 ScaffoldPipeline을 스레드 풀에서 직접 실행합니다.

        엔진은 계측 결과를 `last_telemetry` 에 남길 뿐 어디에 저장할지는 모른다
        (`60-data/rule.md` §4-5). 원장에 넣는 것은 호스트인 이 유스케이스의 일이다.
        """
        pipeline = ScaffoldPipeline(harness=self._harness)
        result = await asyncio.to_thread(pipeline.run, file_path, display_name=display_name)
        return result, pipeline.last_telemetry

    async def execute(self, doc_id: str) -> dict[str, Any]:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        file_path = self._source.resolve_file(doc_id)
        run_id = current_run_id()
        if run_id:
            result, telemetry = await self._run_pipeline(
                file_path, display_name=meta.original_name
            )
        else:
            agent_run, (result, telemetry) = await self._runtime.execute(
                self.name,
                lambda: self._run_pipeline(file_path, display_name=meta.original_name),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}
                ),
            )
            run_id = agent_run.run_id

        # 단계별 상세를 원장에 남긴다. 실패해도 본 작업을 막지 않는다 —
        # 상세의 부재는 오류가 아니라 정상 상태다
        # (`.agents/rules/60-data/observability.md` §2-3).
        if telemetry is not None and run_id:
            try:
                ingest_pipeline_telemetry(
                    telemetry,
                    run_id=run_id,
                    doc_id=doc_id,
                    target_name=meta.original_name,
                )
            except Exception as exc:
                logger.warning("[GenerateScaffold] 계측 저장 실패(치명적 아님): %s", exc)
        logger.info(
            "[GenerateScaffold] 완료: %s (slots=%d, html=%d자)",
            doc_id, len(result.slots), len(result.html_content),
        )

        # 아카이브 실패가 생성 결과 전체를 버리게 하지는 않는다. 본문은 응답에 실려 있다.
        archive_meta = None
        try:
            archive_meta = self._scaffolds.archive_scaffold(doc_id, file_path, result)
        except Exception as exc:
            logger.warning("[GenerateScaffold] 아카이브 실패(치명적 아님): %s", exc, exc_info=True)

        return {
            "status": "completed",
            "docId": doc_id,
            "meta": result.meta.model_dump(by_alias=True),
            "htmlContent": result.html_content,
            "markdownContent": result.markdown_content,
            "slots": [slot.model_dump(by_alias=True) for slot in result.slots],
            "archive": archive_meta.model_dump(by_alias=True) if archive_meta else None,
            "agentRunId": run_id,
        }
