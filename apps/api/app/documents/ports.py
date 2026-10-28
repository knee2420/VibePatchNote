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
    "SegmentArchivePort",
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


class SegmentArchivePort(Protocol):
    """Independent segment aggregate cleanup during document deletion."""

    def delete_for_document(self, doc_id: str) -> None: ...


class RunArchivePort(Protocol):
    """이 문서에서 비롯된 실행 기록을 지우는 계약.

    **프롬프트에는 문서 본문이 실린다.** 그 본문은 실행 기록의 `payloads/` 에
    내용 해시로 외부화되어 남으므로, 원본만 지우면 지운 문서의 내용이 계속
    디스크에 있다. 예전에는 트레이스 연쇄 삭제가 이 역할이었지만, 트레이스
    자체가 쓰이지 않게 된 뒤로 빈 디렉터리를 뒤지는 no-op 이 되어 있었다.
    """

    def delete_for_document(self, doc_id: str) -> int: ...
