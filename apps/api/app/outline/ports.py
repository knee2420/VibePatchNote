"""outline 도메인이 외부 세계에 요구하는 포트(Port) 계약."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Awaitable, Callable, Protocol

from agent_runtime import AgentRunInput, RunCost, current_run_id
from pydantic import BaseModel, ConfigDict, Field

__all__ = [
    "AgentRunInput",
    "AgentRuntimePort",
    "OutlineArchivePort",
    "OutlineArtifactRepository",
    "OutlineDocumentSourcePort",
    "OutlineExtractOutput",
    "OutlineExtractPort",
    "OutlineTelemetryPort",
    "RunCost",
    "current_run_id",
]


class OutlineDocumentSourcePort(Protocol):
    """outline 도메인이 원본 문서에 대해 요구하는 조회 계약."""

    def get(self, doc_id: str) -> Any | None: ...

    def resolve_file(self, doc_id: str) -> Path: ...


class OutlineArtifactRepository(Protocol):
    """outline 아티팩트의 커밋과 조회 계약."""

    def commit(
        self,
        doc_id: str,
        kind: str,
        files: dict[str, Any],
        provenance: Any,
        *,
        set_head: bool = True,
    ) -> Any: ...

    def load_head(self, doc_id: str, kind: str) -> dict[str, Any] | None: ...

    def head_id(self, doc_id: str, kind: str) -> str | None: ...

    def load(self, doc_id: str, kind: str, artifact_id: str) -> dict[str, Any] | None: ...

    def list_versions(self, doc_id: str, kind: str) -> list[Any]: ...


class OutlineExtractOutput(BaseModel):
    """아웃라인 추출 엔진 포트의 반환 데이터 계약 (SSOT)."""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    document_title: str = Field(default="", alias="documentTitle")
    total_pages: int = Field(default=1, alias="totalPages")
    outlines: list[Any] = Field(default_factory=list)
    flat_elements: list[Any] = Field(default_factory=list)
    markdown_outline: str = Field(default="", alias="markdownOutline")
    cost: RunCost = Field(default_factory=RunCost)
    telemetry: dict[str, Any] = Field(default_factory=dict)


class OutlineExtractPort(Protocol):
    """문서 목차/요소 추출 엔진 실행 계약."""

    async def extract(
        self,
        file_path: Path,
        *,
        doc_id: str | None = None,
        context_dir: Path | None = None,
        display_name: str | None = None,
    ) -> OutlineExtractOutput: ...


class OutlineArchivePort(Protocol):
    """아웃라인 아티팩트 보관 및 채택본 조회 계약."""

    def load_adopted(self, meta: Any) -> dict[str, Any] | None: ...

    def archive(
        self,
        meta: Any,
        document: Any,
        *,
        run_id: str,
        cost: RunCost,
        default_model: str = "",
    ) -> Any: ...


class AgentRuntimePort(Protocol):
    """Agent 실행 및 상태 추적 런타임 계약."""

    async def execute(
        self,
        agent_name: str,
        operation: Callable[[], Awaitable[Any]],
        *,
        trace_id: str | None = None,
        doc_id: str | None = None,
        run_input: Any = None,
    ) -> tuple[Any, Any]: ...

    def record_cost(self, run_id: str, cost: RunCost) -> None: ...

    def mark_waiting(
        self, run_id: str, *, failure_code: str, doc_id: str, reason: str
    ) -> None: ...

    def mark_failed(
        self, run_id: str, *, error_code: str, detail: str
    ) -> None: ...

    def settle_failure(
        self,
        run_id: str,
        *,
        error_code: str,
        doc_id: str | None = None,
        detail: str = "",
        reason: str = "",
        attempt: int = 1,
    ) -> None: ...


class OutlineTelemetryPort(Protocol):
    """outline 파이프라인 관측 텔레메트리 계약."""

    def workflow_session(
        self,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
        workflow_name: str = "documents.extract_outline",
        workflow_label: str = "문서 목차 추출",
    ) -> Any: ...
