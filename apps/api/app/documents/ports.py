"""documents 도메인이 외부 세계에 요구하는 순수 계약 (Ports).

여기에는 로컬 디렉터리, JSON 파일, 특정 엔진 등의 구현 세부 사항을 두지 않는다.

저장소가 세 갈래인 것은 수명주기가 셋이기 때문이다:
- DocumentSourceRepository  원본. 지우면 복구 불가        -> data/
- DocumentArtifactRepository LLM 산출물. 재현되지 않음     -> data/
- DocumentCacheRepository   결정적 파생. 언제든 재계산 가능 -> cache/
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol

from .models import ArtifactKind, ArtifactProvenance, DocumentMeta

__all__ = [
    "DocumentArtifactRepository",
    "DocumentCacheRepository",
    "DocumentSourceRepository",
    "SegmentScanPort",
    "WireframeArchivePort",
]


class DocumentSourceRepository(Protocol):
    """원본 문서의 저장과 조회 계약."""

    def save(self, filename: str, content: bytes) -> DocumentMeta: ...

    def get(self, doc_id: str) -> DocumentMeta | None: ...

    def find_by_name(self, filename: str) -> DocumentMeta | None: ...

    def list_all(self) -> list[DocumentMeta]: ...

    def resolve_file(self, doc_id: str) -> Path: ...

    def delete(self, doc_id: str) -> bool: ...


class DocumentArtifactRepository(Protocol):
    """문서 산출물의 커밋과 조회 계약."""

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


class WireframeArchivePort(Protocol):
    """문서 삭제 시 파생된 서식 틀(와이어프레임) 아카이브를 연쇄 정리하기 위한 계약."""

    def delete_for_document(self, doc_id: str) -> int: ...


# 하위 호환 alias
ScaffoldArchivePort = WireframeArchivePort
