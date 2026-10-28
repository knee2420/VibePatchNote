"""wireframe 저장소 어댑터 (물리적 디스크 I/O 및 경로 보안 전담)."""
from __future__ import annotations

import logging
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import ValidationError
from scaffold_engine.wireframe import SlotMappingItem

from app.core.storage import read_json, safe_segment, write_json

from ..schemas import (
    ASSET_HTML,
    ASSET_MANIFEST,
    ASSET_MARKDOWN,
    ASSET_PROMPT_SPEC,
    ASSET_RENDER_HTML,
    ASSET_RENDER_MARKDOWN,
    ASSET_SLOTS,
    ASSET_VISION_ORIGINAL,
    ASSET_VISION_OVERLAY,
    ASSET_VISION_RENDER,
    WireframeArchiveContents,
    WireframeArchiveRecord,
)

logger = logging.getLogger(__name__)

_LEGACY_MD_FENCE = re.compile(
    r"^[`]{3,}markdown[^\n]*\n(.*?)\n[`]{3,}\s*$",
    re.DOTALL | re.MULTILINE,
)


class LocalWireframeRepository:
    """로컬 파일시스템 기반 와이어프레임/스캐폴드 아티팩트 저장소."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def resolve_dir(self, scaffold_id: str) -> Path:
        safe_id = safe_segment(scaffold_id)
        legacy_dir = self._root / safe_id
        if legacy_dir.exists():
            return legacy_dir.resolve()

        matches = sorted(self._root.glob(f"*__{safe_id}")) if self._root.exists() else []
        if len(matches) == 1:
            return matches[0].resolve()
        if len(matches) > 1:
            raise RuntimeError(f"Duplicate wireframe archive directories: {scaffold_id}")
        return legacy_dir.resolve()

    def save_artifacts(
        self,
        record: WireframeArchiveRecord,
        html_content: str,
        markdown_content: str,
        slots: List[SlotMappingItem],
        prompt_spec_md: str,
        original_png: Optional[bytes] = None,
        overlay_png: Optional[bytes] = None,
        render_png: Optional[bytes] = None,
        extra_vision_pngs: Optional[Dict[str, bytes]] = None,
    ) -> Path:
        archive_dir = self._new_archive_dir(record)
        created_now = not archive_dir.exists()
        archive_dir.mkdir(parents=True, exist_ok=True)

        try:
            (archive_dir / "vision").mkdir(parents=True, exist_ok=True)
            (archive_dir / ASSET_HTML).write_text(html_content, encoding="utf-8")
            (archive_dir / ASSET_MARKDOWN).write_text(markdown_content, encoding="utf-8")
            (archive_dir / ASSET_PROMPT_SPEC).write_text(prompt_spec_md, encoding="utf-8")

            slots_data: List[Dict[str, Any]] = [slot.model_dump() for slot in slots]
            write_json(archive_dir / ASSET_SLOTS, slots_data)

            if original_png:
                (archive_dir / ASSET_VISION_ORIGINAL).write_bytes(original_png)
            if overlay_png:
                (archive_dir / ASSET_VISION_OVERLAY).write_bytes(overlay_png)
            if render_png:
                (archive_dir / ASSET_VISION_RENDER).write_bytes(render_png)

            if extra_vision_pngs:
                for subpath, p_bytes in extra_vision_pngs.items():
                    target_file = archive_dir / subpath
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    target_file.write_bytes(p_bytes)

            self._write_manifest(archive_dir, record)
        except Exception:
            if created_now:
                shutil.rmtree(archive_dir, ignore_errors=True)
                logger.warning(
                    "[LocalWireframeRepository] Rolled back partial archive %s", record.scaffold_id
                )
            raise

        logger.info("[LocalWireframeRepository] Saved %s to %s", record.scaffold_id, archive_dir)
        self._write_catalog()
        return archive_dir

    @staticmethod
    def _write_manifest(archive_dir: Path, record: WireframeArchiveRecord) -> None:
        write_json(archive_dir / ASSET_MANIFEST, record.model_dump(mode="json"))

    def save_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str],
        updated_at: str,
    ) -> Optional[WireframeArchiveRecord]:
        archive_dir = self.resolve_dir(scaffold_id)
        record = self._read_record(archive_dir)
        if not record:
            return None

        (archive_dir / ASSET_RENDER_HTML).write_text(html_content, encoding="utf-8")
        if markdown_content is not None:
            (archive_dir / ASSET_RENDER_MARKDOWN).write_text(markdown_content, encoding="utf-8")

        record.revision += 1
        record.updated_at = updated_at
        self._write_manifest(archive_dir, record)
        self._write_catalog()

        logger.info(
            "[LocalWireframeRepository] Saved render r%d for %s", record.revision, record.scaffold_id
        )
        return record

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool:
        archive_dir = self.resolve_dir(scaffold_id)
        if not (archive_dir / ASSET_MANIFEST).exists():
            return False

        target = archive_dir / ASSET_VISION_RENDER
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(png_bytes)
        logger.info(
            "[LocalWireframeRepository] Saved render snapshot (%d bytes) for %s",
            len(png_bytes), scaffold_id,
        )
        return True

    def delete(self, scaffold_id: str) -> bool:
        archive_dir = self.resolve_dir(scaffold_id)
        if not archive_dir.exists():
            return False
        shutil.rmtree(archive_dir, ignore_errors=True)
        self._write_catalog()
        return True

    def delete_for_document(self, doc_id: str) -> int:
        removed = 0
        for record in self.list_for_document(doc_id):
            if self.delete(record.scaffold_id):
                removed += 1
        return removed

    def list_all(self) -> List[WireframeArchiveRecord]:
        if not self._root.exists():
            return []
        found: List[WireframeArchiveRecord] = []
        for archive_dir in self._root.iterdir():
            if not archive_dir.is_dir():
                continue
            record = self._read_record(archive_dir)
            if record:
                found.append(record)
        return found

    def list_for_document(self, doc_id: str) -> List[WireframeArchiveRecord]:
        return [record for record in self.list_all() if record.doc_id == doc_id]

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool:
        return self.get_asset_file(scaffold_id, asset_subpath) is not None

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        archive_dir = self.resolve_dir(scaffold_id)
        candidate = (archive_dir / asset_subpath).resolve()
        try:
            candidate.relative_to(archive_dir)
        except ValueError:
            logger.warning("[LocalWireframeRepository] Rejected traversal: %s", asset_subpath)
            return None
        return candidate if candidate.is_file() else None

    def _read_record(self, archive_dir: Path) -> Optional[WireframeArchiveRecord]:
        raw = read_json(archive_dir / ASSET_MANIFEST)
        if not raw:
            return None
        try:
            return WireframeArchiveRecord(**raw)
        except ValidationError as exc:
            logger.warning(
                "[LocalWireframeRepository] Corrupted manifest in %s: %s", archive_dir.name, exc
            )
            return None

    def _new_archive_dir(self, record: WireframeArchiveRecord) -> Path:
        return self._root / self._archive_dir_name(record)

    @staticmethod
    def _archive_dir_name(record: WireframeArchiveRecord) -> str:
        timestamp = LocalWireframeRepository._folder_timestamp(record.created_at)
        label = LocalWireframeRepository._folder_label(record.title)
        return f"{timestamp}__{label}__{safe_segment(record.scaffold_id)}"

    @staticmethod
    def _folder_timestamp(value: str) -> str:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%Y%m%d-%H%M%S")
        except ValueError:
            return "unknown-time"

    @staticmethod
    def _folder_label(value: str) -> str:
        normalized = unicodedata.normalize("NFC", value or "untitled")
        cleaned = re.sub(r'[<>:"/\\\\|?*\x00-\x1f]', "-", normalized)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .-")
        return (cleaned or "untitled")[:48]

    def _write_catalog(self) -> None:
        records = self.list_all()
        latest_by_doc: dict[str, WireframeArchiveRecord] = {}
        for record in records:
            changed = record.updated_at or record.created_at
            current = latest_by_doc.get(record.doc_id)
            if current is None or changed > (current.updated_at or current.created_at):
                latest_by_doc[record.doc_id] = record

        lines = [
            "# 서식 보관함 (Wireframe Archives)",
            "",
            "각 폴더는 `생성시각__제목__scaffold-ID` 형식입니다.",
            "",
            "## 문서별 최신 작업본",
            "",
            "| 원본 문서 ID | 최신 서식 | 마지막 변경 | 폴더 |",
            "| --- | --- | --- | --- |",
        ]
        for doc_id, record in sorted(latest_by_doc.items(), key=lambda item: item[1].updated_at or item[1].created_at, reverse=True):
            lines.append(
                f"| {doc_id} | {record.title} | {record.updated_at or record.created_at} | {self._archive_dir_name(record)} |"
            )

        lines.extend(["", "## 전체 생성 이력", "", "| 생성 시각 | 원본 문서 ID | 제목 | 작업본 수정 | 폴더 |", "| --- | --- | --- | --- | --- |"])
        for record in sorted(records, key=lambda item: item.created_at, reverse=True):
            lines.append(
                f"| {record.created_at} | {record.doc_id} | {record.title} | {record.updated_at or '-'} | {self._archive_dir_name(record)} |"
            )
        (self._root / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    def _read_slots(self, archive_dir: Path) -> List[SlotMappingItem]:
        raw = read_json(archive_dir / ASSET_SLOTS)
        slots: List[SlotMappingItem] = []
        for item in raw if isinstance(raw, list) else []:
            try:
                slots.append(SlotMappingItem.model_validate(item))
            except ValidationError as exc:
                logger.warning(
                    "[LocalWireframeRepository] Skipped malformed slot in %s: %s",
                    archive_dir.name, exc,
                )
        return slots

    @staticmethod
    def _read_text(path: Path) -> str:
        return path.read_text(encoding="utf-8") if path.exists() else ""

    @staticmethod
    def _read_markdown(archive_dir: Path, prompt_spec_md: str) -> str:
        md_file = archive_dir / ASSET_MARKDOWN
        if md_file.exists():
            return md_file.read_text(encoding="utf-8")

        match = _LEGACY_MD_FENCE.search(prompt_spec_md)
        if match:
            logger.info("[LocalWireframeRepository] Recovered legacy markdown from %s", archive_dir.name)
            return match.group(1)
        return ""

    def find_contents(self, scaffold_id: str) -> Optional[WireframeArchiveContents]:
        archive_dir = self.resolve_dir(scaffold_id)
        record = self._read_record(archive_dir)
        if not record:
            return None

        prompt_spec_md = self._read_text(archive_dir / ASSET_PROMPT_SPEC)
        origin_html = self._read_text(archive_dir / ASSET_HTML)
        origin_markdown = self._read_markdown(archive_dir, prompt_spec_md)

        render_html = self._read_text(archive_dir / ASSET_RENDER_HTML)
        render_markdown = self._read_text(archive_dir / ASSET_RENDER_MARKDOWN)

        return WireframeArchiveContents(
            record=record,
            html_content=render_html or origin_html,
            markdown_content=render_markdown or origin_markdown,
            slots=self._read_slots(archive_dir),
            has_render=bool(render_html),
        )


# 하위 호환성 alias
LocalScaffoldRepository = LocalWireframeRepository
