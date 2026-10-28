"""wireframe 도메인의 파이프라인 관측(Telemetry) 어댑터.

유스케이스가 관측 하부 인프라에 직접 의존하지 않도록,
파이프라인 텔레메트리의 원장(Inspector) 영속화를 전담합니다.
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Generator

from agent_telemetry import StepCollector

from app.core.observation import RunObservationStore

logger = logging.getLogger(__name__)


class WireframeTelemetryAdapter:
    """`WireframeTelemetryPort` 계약의 호스트 구현체.

    저장 위치는 모른다. 관측 자료를 어디에 쓰는지는 `RunObservationStore` 가 알고,
    그 루트는 컨테이너가 준다.
    """

    def __init__(self, store: RunObservationStore) -> None:
        self._store = store

    @contextmanager
    def workflow_session(
        self,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
        workflow_name: str = "wireframe.generate_wireframe",
        workflow_label: str = "서식 틀(와이어프레임) 생성",
    ) -> Generator[StepCollector, None, None]:
        """워크플로우 수집기(StepCollector)를 활성화하고 완료 시 자동으로 Inspector 원장에 영속화합니다."""
        collector = StepCollector(
            pipeline_name="GenerateWireframeWorkflow",
            trace_id=run_id,
            domain="wireframe",
            workflow_name=workflow_name,
            workflow_label=workflow_label,
            target_name=target_name,
        )
        with collector.activate():
            try:
                yield collector
            finally:
                try:
                    telemetry = collector.export_telemetry()
                    self._store.ingest(
                        telemetry,
                        run_id=run_id,
                        doc_id=doc_id,
                        target_name=target_name,
                    )
                except Exception as exc:
                    logger.warning("[WireframeTelemetry] 세션 계측 저장 실패(치명적 아님): %s", exc)

    def record_scaffold_telemetry(
        self,
        telemetry: Any,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
    ) -> None:
        """엔진이 방출한 PipelineTelemetry 객체를 Inspector 원장에 영속화합니다."""
        if telemetry is None:
            return

        try:
            self._store.ingest(
                telemetry,
                run_id=run_id,
                doc_id=doc_id,
                target_name=target_name,
            )
        except Exception as exc:
            logger.warning("[WireframeTelemetry] 계측 저장 실패(치명적 아님): %s", exc)
