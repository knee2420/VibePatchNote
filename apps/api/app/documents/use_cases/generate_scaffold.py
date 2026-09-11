"""스캐폴드 생성 유스케이스 (Agent 경로).

스캐폴드는 문서의 하위 구조가 아니라 자기 식별자와 수명주기를 가진 별개의
애그리거트다. 이 유스케이스는 `doc_id` 만 넘기고 그 안을 알지 못한다.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.agent_runtime import AgentRunInput, AgentRuntime, current_run_id

from ..agents import ScaffoldGenerationAgent
from ..ports import DocumentSourceRepository, ScaffoldArchivePort

logger = logging.getLogger(__name__)


class GenerateScaffoldUseCase:
    """PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 생성한다."""

    name = "documents.generate_scaffold"

    def __init__(
        self,
        source: DocumentSourceRepository,
        scaffolds: ScaffoldArchivePort,
        agent: ScaffoldGenerationAgent,
        agent_runtime: AgentRuntime,
    ) -> None:
        self._source = source
        self._scaffolds = scaffolds
        self._agent = agent
        self._runtime = agent_runtime

    async def execute(self, doc_id: str) -> dict[str, Any]:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        file_path = self._source.resolve_file(doc_id)
        run_id = current_run_id()
        if run_id:
            result = await self._agent.generate(file_path, display_name=meta.original_name)
        else:
            agent_run, result = await self._runtime.execute(
                self._agent.name,
                lambda: self._agent.generate(file_path, display_name=meta.original_name),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}
                ),
            )
            run_id = agent_run.run_id
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
