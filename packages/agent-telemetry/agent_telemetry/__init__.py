"""Agent Telemetry & Tracing Library (Pure Host-Independent Contracts)"""

from agent_telemetry.collector import StepCollector, StepScope
from agent_telemetry.contracts import (
    ExecutionProtocol,
    FallbackChainSummary,
    FailureReason,
    ModelAttemptRecord,
    PipelineTelemetry,
    SpanError,
    SpanMetadata,
    SpanPhase,
    SpanRecord,
    SpanStatus,
    SpanType,
    SpanUsage,
    StageSnapshotRecord,
    usage_from_product_dict,
    usage_to_product_dict,
)

__all__ = [
    "StepCollector",
    "StepScope",
    "SpanType",
    "SpanStatus",
    "SpanPhase",
    "ExecutionProtocol",
    "FailureReason",
    "SpanUsage",
    "SpanError",
    "SpanMetadata",
    "SpanRecord",
    "ModelAttemptRecord",
    "FallbackChainSummary",
    "StageSnapshotRecord",
    "PipelineTelemetry",
    "usage_to_product_dict",
    "usage_from_product_dict",
]
