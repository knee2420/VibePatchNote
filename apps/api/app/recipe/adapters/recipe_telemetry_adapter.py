import logging
from contextlib import contextmanager
from typing import Generator

from agent_telemetry import StepCollector

logger = logging.getLogger(__name__)


class RecipeTelemetryAdapter:
    def __init__(self, store) -> None:
        self._store = store

    @contextmanager
    def workflow_session(
        self, *, run_id: str, doc_id: str, target_name: str
    ) -> Generator[StepCollector, None, None]:
        collector = StepCollector(
            pipeline_name="DistillRecipeWorkflow",
            trace_id=run_id,
            domain="recipe",
            workflow_name="recipes.distill",
            workflow_label="저작 규격 추출",
            target_name=target_name,
        )
        with collector.activate():
            try:
                yield collector
            finally:
                try:
                    self._store.ingest(
                        collector.export_telemetry(),
                        run_id=run_id,
                        doc_id=doc_id,
                        target_name=target_name,
                    )
                except Exception:
                    logger.exception("Recipe telemetry ingestion failed for run %s", run_id)
