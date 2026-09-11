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
    SpanRecord,
    SpanStatus,
    SpanType,
    SpanUsage,
    StageSnapshotRecord,
)

__all__ = [
    "StepCollector",
    "StepScope",
    "SpanType",
    "SpanStatus",
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
]
