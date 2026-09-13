"""문서 도메인의 파이프라인 관측(Telemetry) 어댑터.

유스케이스가 관측 하부 인프라에 직접 의존하지 않도록,
파이프라인 텔레메트리의 원장(Inspector) 영속화를 전담합니다.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.llm import ingest_pipeline_telemetry

logger = logging.getLogger(__name__)


class DocumentTelemetryAdapter:
    """`DocumentTelemetryPort` 계약의 호스트 구현체."""

    def record_outline_telemetry(
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
            ingest_pipeline_telemetry(
                telemetry,
                run_id=run_id,
                doc_id=doc_id,
                target_name=target_name,
            )
        except Exception as exc:
            # 관측 영속화 실패는 비즈니스 본 작업을 중단시키지 않는다 (.agents/rules/60-data/observability.md §2-3).
            logger.warning("[DocumentTelemetry] 계측 저장 실패(치명적 아님): %s", exc)
