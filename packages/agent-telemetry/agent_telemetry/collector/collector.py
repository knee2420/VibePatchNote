from __future__ import annotations
import time
import traceback
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, Generator, List, Optional

from agent_telemetry.collector.scope import StepScope
from agent_telemetry.contracts.attempt import ModelAttemptRecord
from agent_telemetry.contracts.enums import FailureReason, SpanPhase, SpanStatus, SpanType
from agent_telemetry.contracts.metadata import SpanError, SpanMetadata
from agent_telemetry.contracts.snapshot import StageSnapshotRecord
from agent_telemetry.contracts.span import SpanRecord
from agent_telemetry.contracts.telemetry import PipelineTelemetry
from agent_telemetry.contracts.usage import SpanUsage


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _format_time_compact(dt: datetime) -> str:
    """dotted_order 용 밀리초/나노초 축약 타임스탬프"""
    return dt.strftime("%Y%m%dT%H%M%S%fZ")


def _gen_id(prefix: str = "span") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class StepCollector:
    """파이프라인 실행 생명주기 동안 Span, Attempt, Snapshot을 계측·수집하는 수집기"""

    def __init__(
        self,
        pipeline_name: str,
        trace_id: Optional[str] = None,
        domain: str = "documents",
        workflow_name: str = "pipeline",
        workflow_label: str = "",
        target_name: Optional[str] = None,
    ) -> None:
        self.pipeline_name = pipeline_name
        self.trace_id = trace_id or _gen_id("tr")
        self.domain = domain
        self.workflow_name = workflow_name
        self.workflow_label = workflow_label
        self.target_name = target_name
        self.start_time = _utc_now()
        self.status = SpanStatus.RUNNING

        self.spans: List[SpanRecord] = []
        self.attempts: List[ModelAttemptRecord] = []
        self.snapshots: List[StageSnapshotRecord] = []

        # 중첩 스팬 처리를 위한 부모 스택
        self._span_stack: List[SpanRecord] = []

    @contextmanager
    def step(
        self,
        name: str,
        span_type: SpanType = SpanType.CHAIN,
        metadata: Optional[SpanMetadata] = None,
        phase: Optional[SpanPhase] = None,
        display_label: Optional[str] = None,
        description: Optional[str] = None,
        summary_pill: Optional[str] = None,
        node_id: Optional[str] = None,
        node_title: Optional[str] = None,
        data_in: Optional[str] = None,
        data_out: Optional[str] = None,
        data_via: Optional[List[str]] = None,
    ) -> Generator[StepScope, None, None]:
        """단일 작업을 계측하는 컨텍스트 매니저."""
        span_id = _gen_id("span")
        now = _utc_now()
        time_tag = _format_time_compact(now)

        parent = self._span_stack[-1] if self._span_stack else None
        parent_id = parent.span_id if parent else None

        if parent:
            dotted_order = f"{parent.dotted_order}.{time_tag}{span_id}"
        else:
            dotted_order = f"{time_tag}{span_id}"

        span = SpanRecord(
            span_id=span_id,
            trace_id=self.trace_id,
            parent_span_id=parent_id,
            dotted_order=dotted_order,
            name=name,
            span_type=span_type,
            status=SpanStatus.RUNNING,
            phase=phase,
            display_label=display_label,
            description=description,
            summary_pill=summary_pill,
            node_id=node_id,
            node_title=node_title,
            data_in=data_in,
            data_out=data_out,
            data_via=data_via or [],
            start_time=now,
            metadata=metadata or SpanMetadata(),
        )

        scope = StepScope(span, self)
        self._span_stack.append(span)
        t0 = time.time()

        try:
            yield scope
            span.status = SpanStatus.SUCCESS
        except Exception as exc:
            span.status = SpanStatus.FAILED
            span.error = SpanError(
                code=exc.__class__.__name__,
                message=str(exc),
                failure_reason=FailureReason.UNKNOWN,
                stack_trace=traceback.format_exc(),
                stderr=getattr(exc, "stderr", None),
            )
            self.status = SpanStatus.FAILED
            raise
        finally:
            t1 = time.time()
            span.end_time = _utc_now()
            span.usage.latency_ms = round((t1 - t0) * 1000, 2)
            self._span_stack.pop()
            self.spans.append(span)

    def export_telemetry(
        self,
        provenance: Optional[Dict[str, Any]] = None,
        domain: Optional[str] = None,
        workflow_name: Optional[str] = None,
        workflow_label: Optional[str] = None,
        target_name: Optional[str] = None,
    ) -> PipelineTelemetry:
        """수집 완료된 모든 Span, Attempt, Snapshot을 완결 텔레메트리 계약 객체로 패키징"""
        end_time = _utc_now()
        total_latency_ms = round((end_time - self.start_time).total_seconds() * 1000, 2)

        # 전체 토큰 및 사용량 합산
        total_usage = SpanUsage(latency_ms=total_latency_ms)
        for sp in self.spans:
            total_usage.prompt_tokens += sp.usage.prompt_tokens
            total_usage.completion_tokens += sp.usage.completion_tokens
            if sp.usage.reasoning_tokens:
                total_usage.reasoning_tokens = (total_usage.reasoning_tokens or 0) + sp.usage.reasoning_tokens
            total_usage.total_tokens += sp.usage.total_tokens

        final_status = self.status
        if final_status == SpanStatus.RUNNING:
            final_status = SpanStatus.SUCCESS

        return PipelineTelemetry(
            pipeline_name=self.pipeline_name,
            trace_id=self.trace_id,
            domain=domain or self.domain,
            workflow_name=workflow_name or self.workflow_name,
            workflow_label=workflow_label or self.workflow_label,
            target_name=target_name or self.target_name,
            status=final_status,
            start_time=self.start_time,
            end_time=end_time,
            total_latency_ms=total_latency_ms,
            total_usage=total_usage,
            provenance=provenance or {},
            spans=self.spans,
            attempts=self.attempts,
            snapshots=self.snapshots,
        )
