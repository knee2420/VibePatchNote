"""scaffolds 저장소 계층 (SRP & DIP: 물리적 디스크 I/O 및 경로 보안 전담).

저장소는 URL 을 모른다. 실행 환경에 종속되지 않는 코어 레코드(manifest.json)와
본문 아티팩트만 다루고, 공개 URL 조립은 상위 계층(service/formatters)이 맡는다.
"""
import json
import logging
import re
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol

from app.core.config import settings
from app.core.storage.document_storage import document_storage
from pydantic import ValidationError
from scaffold_engine.types import SlotMappingItem

from .schemas import (
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


def sanitize_scaffold_id(name: str) -> str:
    """안전한 파일시스템 디렉터리 및 URL 식별자로 정제."""
    clean = re.sub(r"[^\w\-.]", "_", name)
    return clean.strip("_") or "scaffold"


class IScaffoldRepository(Protocol):
    """스캐폴드 아티팩트 저장소 추상 인터페이스 (DIP 준수)."""

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
        ...

    def save_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str],
        updated_at: str,
    ) -> Optional[ScaffoldArchiveRecord]:
        ...

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool:
        ...

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool:
        ...

    def find_contents(self, scaffold_id: str) -> Optional[ScaffoldArchiveContents]:
        ...

    def find_all_records(self) -> List[ScaffoldArchiveRecord]:
        ...

    def resolve_dir(self, scaffold_id: str) -> Path:
        ...

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        ...


class LocalScaffoldRepository:
    """
    로컬 파일시스템 기반 스캐폴드 아티팩트 저장소 구현체 (Document-Centric SSOT & Fallback).
    
    신규 스캐폴드는 `storage/documents/{doc_slug}/scaffolds/{scaffold_id}`에 저장하고,
    기존 레거시 `storage/scaffolds/{scaffold_id}`와의 하위 호환성을 완벽히 보장합니다.
    """

    def __init__(self, root_dir: Optional[Path] = None) -> None:
        self.root_dir = root_dir or settings.scaffold_storage_dir

    def _ensure_root(self) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        return self.root_dir

    def resolve_dir(self, scaffold_id: str) -> Path:
        """
        scaffold_id에 해당하는 디렉터리를 탐색합니다.
        1순위: 신규 통합 문서 패키지 내부 (storage/documents/*/scaffolds/{scaffold_id})
        2순위: 기존 레거시 스캐폴드 디렉터리 (storage/scaffolds/{scaffold_id})
        """
        clean_id = sanitize_scaffold_id(scaffold_id)
        # 1. 신규 문서 패키지 탐색
        pkg_scaffold_dir = document_storage.find_scaffold_dir(clean_id)
        if pkg_scaffold_dir:
            return pkg_scaffold_dir

        # 2. 레거시 디렉터리 폴백
        return (self.root_dir / clean_id).resolve()

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
        """스캐폴드 아티팩트를 문서 중심 디렉터리에 물리적으로 기록."""
        clean_id = sanitize_scaffold_id(record.scaffold_id)

        # 항상 문서 패키지 하위의 scaffolds/ 에 영속화
        doc_key = record.source_pdf_file_name or "scaffold"
        pkg = document_storage.get_package(doc_key)
        pkg.ensure()
        archive_dir = pkg.scaffolds_dir / clean_id
        created_now = not archive_dir.exists()

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
            with open(archive_dir / ASSET_SLOTS, "w", encoding="utf-8") as f:
                json.dump(slots_data, f, ensure_ascii=False, indent=2)

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
        return archive_dir

    @staticmethod
    def _write_manifest(archive_dir: Path, record: ScaffoldArchiveRecord) -> None:
        with open(archive_dir / ASSET_MANIFEST, "w", encoding="utf-8") as f:
            json.dump(record.model_dump(), f, ensure_ascii=False, indent=2)

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

        logger.info(
            "[LocalScaffoldRepository] Saved render r%d for %s", record.revision, record.scaffold_id
        )
        return record

    def save_render_image(self, scaffold_id: str, png_bytes: bytes) -> bool:
        """재구성본(Tiptap 이 실제로 그린 화면)의 스냅샷 PNG 를 보관한다.

        원본 PDF 렌더(original)·슬롯 오버레이(overlay)와 나란히 두어, 한 서식의
        '원본 / 좌표 검증 / 재구성 결과' 세 장면을 같은 자리에서 비교할 수 있게 한다.
        """
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

    def has_asset(self, scaffold_id: str, asset_subpath: str) -> bool:
        """아카이브에 해당 에셋이 실제로 존재하는지 확인한다."""
        return self.get_asset_file(scaffold_id, asset_subpath) is not None

    def _read_record(self, archive_dir: Path) -> Optional[ScaffoldArchiveRecord]:
        """manifest.json 을 코어 레코드로 복원. 구 포맷의 URL 키는 무시된다."""
        manifest_file = archive_dir / ASSET_MANIFEST
        if not manifest_file.exists():
            return None
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                return ScaffoldArchiveRecord(**json.load(f))
        except Exception as exc:
            logger.warning("[LocalScaffoldRepository] Corrupted manifest in %s: %s", archive_dir.name, exc)
            return None

    def _read_slots(self, archive_dir: Path) -> List[SlotMappingItem]:
        """슬롯 JSON 을 엔진 모델로 복원. 별칭/필드명 표기 모두 수용한다."""
        slots_file = archive_dir / ASSET_SLOTS
        if not slots_file.exists():
            return []
        try:
            with open(slots_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception as exc:
            logger.warning("[LocalScaffoldRepository] Unreadable slots in %s: %s", archive_dir.name, exc)
            return []

        slots: List[SlotMappingItem] = []
        for item in raw if isinstance(raw, list) else []:
            try:
                slots.append(SlotMappingItem.model_validate(item))
            except ValidationError as exc:
                logger.warning("[LocalScaffoldRepository] Skipped malformed slot in %s: %s", archive_dir.name, exc)
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

        try:
            spec_file = archive_dir / ASSET_PROMPT_SPEC
            prompt_spec_md = spec_file.read_text(encoding="utf-8") if spec_file.exists() else ""

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
        except Exception as exc:
            logger.exception("[LocalScaffoldRepository] Failed to read archive for %s: %s", scaffold_id, exc)
            return None

    def find_all_records(self) -> List[ScaffoldArchiveRecord]:
        """저장된 모든 아카이브 레코드를 통합 수집하여 최신순으로 조회."""
        seen_ids = set()
        results: List[ScaffoldArchiveRecord] = []

        # 1. 신규 문서 패키지 하위의 스캐폴드 탐색 (1순위)
        for p in document_storage.find_all_scaffold_dirs():
            record = self._read_record(p)
            if record and record.scaffold_id not in seen_ids:
                seen_ids.add(record.scaffold_id)
                results.append(record)

        # 2. 레거시 디렉터리가 남아있는 경우에만 폴백 탐색
        if self.root_dir.exists():
            for p in self.root_dir.iterdir():
                if not p.is_dir():
                    continue
                record = self._read_record(p)
                if record and record.scaffold_id not in seen_ids:
                    seen_ids.add(record.scaffold_id)
                    results.append(record)

        # 생성일자(created_at) 내림차순 정렬
        results.sort(key=lambda r: r.created_at or "", reverse=True)
        return results

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        """경로 조작(..) 방어 및 물리적 에셋 파일 경로 해석."""
        archive_dir = self.resolve_dir(scaffold_id)

        target_file = (archive_dir / asset_subpath).resolve()
        try:
            target_file.relative_to(archive_dir)
        except ValueError:
            logger.warning("[LocalScaffoldRepository] Directory traversal blocked: %s / %s", scaffold_id, asset_subpath)
            return None

        if target_file.is_file():
            return target_file
        return None


local_scaffold_repository = LocalScaffoldRepository()
