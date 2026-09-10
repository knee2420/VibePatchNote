"""scaffolds 유스케이스가 외부 영속화에 요구하는 계약."""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Protocol

from scaffold_engine.types import SlotMappingItem

from .schemas import ScaffoldArchiveContents, ScaffoldArchiveRecord


class ScaffoldRepository(Protocol):
    """스캐폴드 아티팩트 영속화 계약."""

    def save_artifacts(
        self,
        record: ScaffoldArchiveRecord,
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
    ) -> Optional[ScaffoldArchiveRecord]: ...

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool: ...

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool: ...

    def find_contents(self, scaffold_id: str) -> Optional[ScaffoldArchiveContents]: ...

    def resolve_dir(self, scaffold_id: str) -> Path: ...

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]: ...

    def list_all(self) -> List[ScaffoldArchiveRecord]: ...

    def list_for_document(self, doc_id: str) -> List[ScaffoldArchiveRecord]: ...

    def delete(self, scaffold_id: str) -> bool: ...

    def delete_for_document(self, doc_id: str) -> int: ...

