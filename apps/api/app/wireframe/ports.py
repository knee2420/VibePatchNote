"""wireframe 도메인이 외부 세계에 요구하는 계약 (Ports)."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Awaitable, Callable, List, Optional, Protocol

from agent_runtime import AgentRunInput, RunCost, current_run_id
from pydantic import BaseModel, ConfigDict, Field
from scaffold_engine import ScaffoldMeta, SlotMappingItem

__all__ = [
    "AgentRunInput",
    "AgentRuntimePort",
    "RunCost",
    "ScaffoldArchivePort",
    "ScaffoldExtractOutput",
    "ScaffoldExtractPort",
    "ScaffoldRepository",
    "WireframeArchivePort",
    "WireframeDocumentSourcePort",
    "WireframeExtractOutput",
    "WireframeExtractPort",
    "WireframeRepository",
    "WireframeTelemetryPort",
    "current_run_id",
]


class WireframeDocumentSourcePort(Protocol):
    """원본 문서의 파일 경로 및 메타 조회 계약."""

    def get(self, doc_id: str) -> Any | None: ...

    def resolve_file(self, doc_id: str) -> Path: ...


class WireframeExtractOutput(BaseModel):
    """와이어프레임(서식 틀) 추출 엔진 포트의 반환 데이터 계약 (SSOT)."""

    model_config = ConfigDict(populate_by_name=True)

    meta: ScaffoldMeta
    html_content: str = Field(alias="htmlContent")
    markdown_content: str = Field(alias="markdownContent")
    slots: list[SlotMappingItem] = Field(default_factory=list)
    cost: RunCost = Field(default_factory=RunCost)
    telemetry: dict[str, Any] = Field(default_factory=dict)


class WireframeExtractPort(Protocol):
    """문서 스캐폴딩/와이어프레임 추출 엔진 실행 계약."""

    async def extract(
        self,
        file_path: Path,
        *,
        display_name: str | None = None,
    ) -> WireframeExtractOutput: ...


class WireframeArchivePort(Protocol):
    """와이어프레임 아티팩트 보관 계약."""

    def archive_scaffold(self, doc_id: str, source_path: Path, result: Any) -> Any: ...

    def delete_for_document(self, doc_id: str) -> int: ...


class WireframeRepository(Protocol):
    """와이어프레임 아카이브 디스크 저장소 계약."""

    def save_artifacts(
        self,
        record: Any,
        html_content: str,
        markdown_content: str,
        slots: List[SlotMappingItem],
        prompt_spec_md: str,
        original_png: Optional[bytes] = None,
        overlay_png: Optional[bytes] = None,
        render_png: Optional[bytes] = None,
    ) -> Path: ...

    def save_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str],
        updated_at: str,
    ) -> Optional[Any]: ...

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool: ...

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool: ...

    def find_contents(self, scaffold_id: str) -> Optional[Any]: ...

    def resolve_dir(self, scaffold_id: str) -> Path: ...

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]: ...

    def list_all(self) -> List[Any]: ...

    def list_for_document(self, doc_id: str) -> List[Any]: ...

    def delete(self, scaffold_id: str) -> bool: ...

    def delete_for_document(self, doc_id: str) -> int: ...


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


class WireframeTelemetryPort(Protocol):
    """wireframe 파이프라인 관측 텔레메트리 계약."""

    def workflow_session(
        self,
        *,
        run_id: str,
        doc_id: str,
        target_name: str,
        workflow_name: str = "documents.generate_scaffold",
        workflow_label: str = "와이어프레임 생성",
    ) -> Any: ...


# 하위 호환성 alias
ScaffoldExtractOutput = WireframeExtractOutput
ScaffoldExtractPort = WireframeExtractPort
ScaffoldArchivePort = WireframeArchivePort
ScaffoldRepository = WireframeRepository
