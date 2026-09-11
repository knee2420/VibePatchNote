"""scaffolds 저장소 계층 (SRP & DIP: 물리적 디스크 I/O 및 경로 보안 전담).

    data/knowledge/scaffolds/{scaffold_id}/
      ├── manifest.json     환경 비종속 코어 레코드 (doc_id 포함)
      ├── scaffold.html     엔진 원본 (불변, 회귀 추적 기준선)
      ├── content.md
      ├── render.html       사용자 작업본
      ├── render.md
      ├── prompt_spec.md
      ├── slots.json
      └── vision/

스캐폴드는 자기 식별자를 가진 애그리거트 루트다. 문서 패키지 안에 묻어 두면
id 하나를 찾는 데 전체 문서 디렉터리를 훑어야 하고, 그 순간 scaffolds 도메인이
documents 의 저장 구조를 알게 된다.

저장소는 URL 을 모른다. 실행 환경에 종속되지 않는 코어 레코드(manifest.json)와
본문 아티팩트만 다루고, 공개 URL 조립은 상위 계층(service/formatters)이 맡는다.
"""
from __future__ import annotations

import logging
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import ValidationError
from scaffold_engine.types import SlotMappingItem

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
    ScaffoldArchiveContents,
    ScaffoldArchiveRecord,
)

logger = logging.getLogger(__name__)

# 구(舊) 아카이브 호환: 원문 마크다운이 명세서 코드펜스 안에만 있던 시절의 포맷.
_LEGACY_MD_FENCE = re.compile(
    r"^[`]{3,}markdown[^\n]*\n(.*?)\n[`]{3,}\s*$",
    re.DOTALL | re.MULTILINE,
)


class LocalScaffoldRepository:
    """로컬 파일시스템 기반 스캐폴드 아티팩트 저장소."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def resolve_dir(self, scaffold_id: str) -> Path:
        """식별자로 아카이브 위치를 찾는다.

        폴더 이름은 탐색기에서 바로 읽을 수 있게 생성 시각·제목·식별자를 함께
        담는다. 외부 계약은 여전히 ``scaffold_id`` 하나이므로, 구 v2 레이아웃과
        새 레이아웃 모두 이 경계에서만 해석한다.
        """
        safe_id = safe_segment(scaffold_id)
        legacy_dir = self._root / safe_id
        if legacy_dir.exists():
            return legacy_dir.resolve()

        matches = sorted(self._root.glob(f"*__{safe_id}")) if self._root.exists() else []
        if len(matches) == 1:
            return matches[0].resolve()
        if len(matches) > 1:
            raise RuntimeError(f"Duplicate scaffold archive directories: {scaffold_id}")
        return legacy_dir.resolve()

    # --- 쓰기 -----------------------------------------------------------

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
    ) -> Path:
        archive_dir = self._new_archive_dir(record)
        created_now = not archive_dir.exists()
        archive_dir.mkdir(parents=True, exist_ok=True)

        try:
            (archive_dir / "vision").mkdir(parents=True, exist_ok=True)

            # 1. 본문 아티팩트. 마크다운은 엔진 원문 그대로 별도 파일에 남긴다.
            #    명세서(prompt_spec.md)는 이 원문에서 파생된 표현일 뿐이라,
            #    둘을 한 파일로 합치면 복원 시 원문을 되찾을 수 없다.
            (archive_dir / ASSET_HTML).write_text(html_content, encoding="utf-8")
            (archive_dir / ASSET_MARKDOWN).write_text(markdown_content, encoding="utf-8")
            (archive_dir / ASSET_PROMPT_SPEC).write_text(prompt_spec_md, encoding="utf-8")

            # 2. 좌표는 엔진 필드명(snake_case) 그대로 저장한다. 전송용 별칭은 응답 시 입힌다.
            slots_data: List[Dict[str, Any]] = [slot.model_dump() for slot in slots]
            write_json(archive_dir / ASSET_SLOTS, slots_data)

            # 3. 비전 바이너리 아티팩트 기록
            if original_png:
                (archive_dir / ASSET_VISION_ORIGINAL).write_bytes(original_png)
            if overlay_png:
                (archive_dir / ASSET_VISION_OVERLAY).write_bytes(overlay_png)
            if render_png:
                (archive_dir / ASSET_VISION_RENDER).write_bytes(render_png)

            # 4. 매니페스트는 마지막에. 이 파일의 존재가 곧 '완성된 아카이브'의 표식이다.
            self._write_manifest(archive_dir, record)
        except Exception:
            if created_now:
                shutil.rmtree(archive_dir, ignore_errors=True)
                logger.warning(
                    "[LocalScaffoldRepository] Rolled back partial archive %s", record.scaffold_id
                )
            raise

        logger.info("[LocalScaffoldRepository] Saved %s to %s", record.scaffold_id, archive_dir)
        self._write_catalog()
        return archive_dir

    @staticmethod
    def _write_manifest(archive_dir: Path, record: ScaffoldArchiveRecord) -> None:
        write_json(archive_dir / ASSET_MANIFEST, record.model_dump(mode="json"))

    def save_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str],
        updated_at: str,
    ) -> Optional[ScaffoldArchiveRecord]:
        """사용자 편집 작업본을 기록하고 리비전을 올린다.

        엔진 원본(scaffold.html / content.md)은 건드리지 않는다. 원본을 덮어쓰면
        엔진 품질 회귀를 추적할 기준선이 사라지기 때문이다.
        """
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
        self._write_catalog()

        logger.info(
            "[LocalScaffoldRepository] Saved render r%d for %s", record.revision, record.scaffold_id
        )
        return record

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool:
        """재구성본(Tiptap 이 실제로 그린 화면)의 스냅샷 PNG 를 보관한다."""
        archive_dir = self.resolve_dir(scaffold_id)
        if not (archive_dir / ASSET_MANIFEST).exists():
            return False

        target = archive_dir / ASSET_VISION_RENDER
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(png_bytes)
        logger.info(
            "[LocalScaffoldRepository] Saved render snapshot (%d bytes) for %s",
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
        """문서 삭제에 연쇄된다. 원본이 사라지면 그 원본의 서식도 남을 이유가 없다."""
        removed = 0
        for record in self.list_for_document(doc_id):
            if self.delete(record.scaffold_id):
                removed += 1
        return removed

    # --- 읽기 -----------------------------------------------------------

    def list_all(self) -> List[ScaffoldArchiveRecord]:
        if not self._root.exists():
            return []
        found: List[ScaffoldArchiveRecord] = []
        for archive_dir in self._root.iterdir():
            if not archive_dir.is_dir():
                continue
            record = self._read_record(archive_dir)
            if record:
                found.append(record)
        return found

    def list_for_document(self, doc_id: str) -> List[ScaffoldArchiveRecord]:
        return [record for record in self.list_all() if record.doc_id == doc_id]

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool:
        return self.get_asset_file(scaffold_id, asset_subpath) is not None

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        """에셋 경로를 해석한다. 아카이브 밖으로 나가는 경로는 거부한다."""
        archive_dir = self.resolve_dir(scaffold_id)
        candidate = (archive_dir / asset_subpath).resolve()
        try:
            candidate.relative_to(archive_dir)
        except ValueError:
            logger.warning("[LocalScaffoldRepository] Rejected traversal: %s", asset_subpath)
            return None
        return candidate if candidate.is_file() else None

    def _read_record(self, archive_dir: Path) -> Optional[ScaffoldArchiveRecord]:
        """manifest.json 을 코어 레코드로 복원. 구 포맷의 URL 키는 무시된다."""
        raw = read_json(archive_dir / ASSET_MANIFEST)
        if not raw:
            return None
        try:
            return ScaffoldArchiveRecord(**raw)
        except ValidationError as exc:
            logger.warning(
                "[LocalScaffoldRepository] Corrupted manifest in %s: %s", archive_dir.name, exc
            )
            return None

    def _new_archive_dir(self, record: ScaffoldArchiveRecord) -> Path:
        """새 아카이브의 사람 친화적인 폴더명을 만든다.

        ID는 끝에 그대로 남겨 API 포인터와 충돌하지 않고, 앞부분만 탐색기용
        라벨이다. 제목이 바뀌어도 저장된 ID는 변하지 않는다.
        """
        return self._root / self._archive_dir_name(record)

    @staticmethod
    def _archive_dir_name(record: ScaffoldArchiveRecord) -> str:
        timestamp = LocalScaffoldRepository._folder_timestamp(record.created_at)
        label = LocalScaffoldRepository._folder_label(record.title)
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
        """루트에서 바로 최신본과 문서별 이력을 볼 수 있는 안내서를 갱신한다."""
        records = self.list_all()
        latest_by_doc: dict[str, ScaffoldArchiveRecord] = {}
        for record in records:
            changed = record.updated_at or record.created_at
            current = latest_by_doc.get(record.doc_id)
            if current is None or changed > (current.updated_at or current.created_at):
                latest_by_doc[record.doc_id] = record

        lines = [
            "# 스캐폴드 보관함",
            "",
            "각 폴더는 `생성시각__제목__scaffold-ID` 형식입니다. ID는 API와 캔버스가 참조하는 고정 식별자이며, 제목·시각은 탐색기에서 빠르게 구분하기 위한 표시값입니다.",
            "",
            "## 문서별 최신 작업본",
            "",
            "| 원본 문서 ID | 최신 스캐폴드 | 마지막 변경 | 폴더 |",
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
        """슬롯 JSON 을 엔진 모델로 복원. 별칭/필드명 표기 모두 수용한다."""
        raw = read_json(archive_dir / ASSET_SLOTS)
        slots: List[SlotMappingItem] = []
        for item in raw if isinstance(raw, list) else []:
            try:
                slots.append(SlotMappingItem.model_validate(item))
            except ValidationError as exc:
                logger.warning(
                    "[LocalScaffoldRepository] Skipped malformed slot in %s: %s",
                    archive_dir.name, exc,
                )
        return slots

    @staticmethod
    def _read_text(path: Path) -> str:
        return path.read_text(encoding="utf-8") if path.exists() else ""

    @staticmethod
    def _read_markdown(archive_dir: Path, prompt_spec_md: str) -> str:
        """엔진 원문 마크다운 복원. 구 아카이브는 명세서 코드펜스에서 되꺼낸다."""
        md_file = archive_dir / ASSET_MARKDOWN
        if md_file.exists():
            return md_file.read_text(encoding="utf-8")

        match = _LEGACY_MD_FENCE.search(prompt_spec_md)
        if match:
            logger.info("[LocalScaffoldRepository] Recovered legacy markdown from %s", archive_dir.name)
            return match.group(1)
        return ""

    def find_contents(self, scaffold_id: str) -> Optional[ScaffoldArchiveContents]:
        """ID로 단일 아카이브의 레코드와 본문을 복원."""
        archive_dir = self.resolve_dir(scaffold_id)
        record = self._read_record(archive_dir)
        if not record:
            return None

        prompt_spec_md = self._read_text(archive_dir / ASSET_PROMPT_SPEC)
        origin_html = self._read_text(archive_dir / ASSET_HTML)
        origin_markdown = self._read_markdown(archive_dir, prompt_spec_md)

        # 작업본이 있으면 그것이 현재 본문. 없으면 엔진 원본이 곧 현재 본문이다.
        render_html = self._read_text(archive_dir / ASSET_RENDER_HTML)
        render_markdown = self._read_text(archive_dir / ASSET_RENDER_MARKDOWN)

        return ScaffoldArchiveContents(
            record=record,
            html_content=render_html or origin_html,
            markdown_content=render_markdown or origin_markdown,
            origin_html_content=origin_html,
            origin_markdown_content=origin_markdown,
            prompt_spec_md=prompt_spec_md,
            slots=self._read_slots(archive_dir),
        )
