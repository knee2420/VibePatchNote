"""documents 유스케이스가 외부 세계에 요구하는 계약.

여기에는 로컬 디렉터리, JSON 파일, SQLAlchemy 같은 구현 세부 사항을 두지 않는다.

저장소가 세 갈래인 것은 **수명주기가 셋이기 때문**이다.

- `DocumentSourceRepository`  원본. 지우면 복구 불가        → data/
- `DocumentArtifactRepository` LLM 산출물. 재현되지 않음     → data/
- `DocumentCacheRepository`   결정적 파생. 언제든 재계산 가능 → cache/

이 셋을 한 포트로 합치면 "지워도 되는가"가 다시 흐려진다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Awaitable, Callable, Protocol

from .models import ArtifactKind, ArtifactProvenance, DocumentMeta


class DocumentSourceRepository(Protocol):
    """원본 문서의 저장과 조회 계약."""

    def save(self, filename: str, content: bytes) -> DocumentMeta: ...

    def get(self, doc_id: str) -> DocumentMeta | None: ...

    def find_by_name(self, filename: str) -> DocumentMeta | None: ...

    def list_all(self) -> list[DocumentMeta]: ...

    def resolve_file(self, doc_id: str) -> Path: ...

    def delete(self, doc_id: str) -> bool: ...


class DocumentArtifactRepository(Protocol):
    """LLM 산출물의 커밋과 조회 계약.

    커밋된 산출물은 바뀌지 않는다. 다시 분석하면 새 `artifact_id` 가 생기고
    HEAD 포인터만 옮겨 간다. 그래야 이전 결과와 비교할 수 있다.
    """

    def commit(
        self,
        doc_id: str,
        kind: ArtifactKind,
        files: dict[str, Any],
        provenance: ArtifactProvenance,
        *,
        set_head: bool = True,
    ) -> ArtifactProvenance: ...

    def load_head(self, doc_id: str, kind: ArtifactKind) -> dict[str, Any] | None: ...

    def head_id(self, doc_id: str, kind: ArtifactKind) -> str | None: ...

    def load(self, doc_id: str, kind: ArtifactKind, artifact_id: str) -> dict[str, Any] | None: ...

    def list_versions(self, doc_id: str, kind: ArtifactKind) -> list[ArtifactProvenance]: ...

    def delete_all(self, doc_id: str) -> None: ...


class DocumentCacheRepository(Protocol):
    """결정적 파생의 보관 계약. 통째로 지워도 재계산으로 복구된다."""

    def context_dir(self, doc_id: str) -> Path: ...

    def save_page_image(self, doc_id: str, page_number: int, png_bytes: bytes) -> Path: ...

    def get_page_image(self, doc_id: str, page_number: int) -> Path | None: ...

    def save_geometry(self, doc_id: str, geometry: dict[str, Any]) -> None: ...

    def load_geometry(self, doc_id: str) -> dict[str, Any] | None: ...

    def clear(self, doc_id: str) -> None: ...


class SegmentScanPort(Protocol):
    """문서 세그먼트 분석 실행 계약."""

    async def scan(self, prompt: str) -> dict[str, Any] | None: ...


class ScaffoldArchivePort(Protocol):
    """documents 가 scaffold 산출물을 보관하기 위해 요구하는 계약.

    스캐폴드는 문서에 종속된 하위 구조가 아니라 자기 식별자와 수명주기를 가진
    별개의 애그리거트다. documents 는 `doc_id` 만 넘기고 그 안을 알지 못한다.
    """

    def archive_scaffold(self, doc_id: str, source_path: Path, result: Any) -> Any: ...

    def delete_for_document(self, doc_id: str) -> int: ...


class AgentRuntimePort(Protocol):
    """documents 유스케이스가 Agent 실행과 상태 추적에 요구하는 런타임 계약."""

    async def execute(
        self,
        agent_name: str,
        operation: Callable[[], Awaitable[Any]],
        *,
        trace_id: str | None = None,
        doc_id: str | None = None,
        run_input: Any = None,
    ) -> tuple[Any, Any]: ...
