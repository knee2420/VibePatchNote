"""Segments aggregate telemetry adapter."""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator

from agent_telemetry import StepCollector

from app.core.observation import RunObservationStore

logger = logging.getLogger(__name__)


class SegmentTelemetryAdapter:
    """Persists segment extraction telemetry without exposing storage to the domain."""

    def __init__(self, store: RunObservationStore) -> None:
        self._store = store

    @contextmanager
    def workflow_session(
        self,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
        workflow_name: str = "segments.extract",
        workflow_label: str = "문서 세그먼트 추출",
    ) -> Generator[StepCollector, None, None]:
        collector = StepCollector(
            pipeline_name="ExtractSegmentsWorkflow",
            trace_id=run_id,
            domain="segments",
            workflow_name=workflow_name,
            workflow_label=workflow_label,
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
                except Exception as exc:
                    logger.warning("[SegmentTelemetry] 계측 저장 실패(치명적 아님): %s", exc)
