"""scaffolds 저장소 계층 (SRP & DIP: 물리적 디스크 I/O 및 경로 보안 전담)."""
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol

from app.core.config import settings
from .schemas import ScaffoldArchiveDetail, ScaffoldArchiveMeta

logger = logging.getLogger(__name__)


def sanitize_scaffold_id(name: str) -> str:
    """안전한 파일시스템 디렉터리 및 URL 식별자로 정제."""
    clean = re.sub(r"[^\w\-.]", "_", name)
    return clean.strip("_") or "scaffold"


class IScaffoldRepository(Protocol):
    """스캐폴드 아티팩트 저장소 추상 인터페이스 (DIP 준수)."""

    def save_artifacts(
        self,
        scaffold_id: str,
        manifest_data: Dict[str, Any],
        html_content: str,
        slots_data: List[Dict[str, Any]],
        prompt_spec_md: str,
        original_png: Optional[bytes] = None,
        overlay_png: Optional[bytes] = None,
    ) -> Path:
        ...

    def find_by_id(self, scaffold_id: str) -> Optional[ScaffoldArchiveDetail]:
        ...

    def find_all(self) -> List[ScaffoldArchiveMeta]:
        ...

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        ...


class LocalScaffoldRepository:
    """로컬 파일시스템 기반 스캐폴드 아티팩트 저장소 구현체."""

    def __init__(self, root_dir: Optional[Path] = None) -> None:
        self.root_dir = root_dir or settings.scaffold_storage_dir

    def _ensure_root(self) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        return self.root_dir

    def save_artifacts(
        self,
        scaffold_id: str,
        manifest_data: Dict[str, Any],
        html_content: str,
        slots_data: List[Dict[str, Any]],
        prompt_spec_md: str,
        original_png: Optional[bytes] = None,
        overlay_png: Optional[bytes] = None,
    ) -> Path:
        """스캐폴드 5대 아티팩트를 격리 디렉터리에 물리적으로 기록."""
        self._ensure_root()
        clean_id = sanitize_scaffold_id(scaffold_id)
        archive_dir = self.root_dir / clean_id
        vision_dir = archive_dir / "vision"
        vision_dir.mkdir(parents=True, exist_ok=True)

        # 1. 텍스트 / 마크업 아티팩트 기록
        (archive_dir / "scaffold.html").write_text(html_content, encoding="utf-8")
        (archive_dir / "prompt_spec.md").write_text(prompt_spec_md, encoding="utf-8")

        with open(archive_dir / "slots.json", "w", encoding="utf-8") as f:
            json.dump(slots_data, f, ensure_ascii=False, indent=2)

        with open(archive_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, ensure_ascii=False, indent=2)

        # 2. 비전 바이너리 아티팩트 기록
        if original_png:
            (vision_dir / "original_p1.png").write_bytes(original_png)
        if overlay_png:
            (vision_dir / "overlay_p1.png").write_bytes(overlay_png)

        logger.info("[LocalScaffoldRepository] Saved %s to %s", scaffold_id, archive_dir)
        return archive_dir

    def find_by_id(self, scaffold_id: str) -> Optional[ScaffoldArchiveDetail]:
        """ID로 단일 아카이브 상세 조회."""
        clean_id = sanitize_scaffold_id(scaffold_id)
        archive_dir = self.root_dir / clean_id
        manifest_file = archive_dir / "manifest.json"

        if not manifest_file.exists():
            return None

        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)

            html_file = archive_dir / "scaffold.html"
            html_content = html_file.read_text(encoding="utf-8") if html_file.exists() else ""

            md_file = archive_dir / "prompt_spec.md"
            markdown_content = md_file.read_text(encoding="utf-8") if md_file.exists() else ""

            slots_file = archive_dir / "slots.json"
            slots = []
            if slots_file.exists():
                with open(slots_file, "r", encoding="utf-8") as f:
                    slots = json.load(f)

            return ScaffoldArchiveDetail(
                **manifest_data,
                html_content=html_content,
                markdown_content=markdown_content,
                slots=slots,
            )
        except Exception as exc:
            logger.exception("[LocalScaffoldRepository] Failed to read archive for %s: %s", clean_id, exc)
            return None

    def find_all(self) -> List[ScaffoldArchiveMeta]:
        """저장된 모든 아카이브 메타데이터를 최신순으로 조회."""
        self._ensure_root()
        results: List[ScaffoldArchiveMeta] = []

        for p in sorted(self.root_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            if not p.is_dir():
                continue
            manifest_file = p / "manifest.json"
            if manifest_file.exists():
                try:
                    with open(manifest_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        results.append(ScaffoldArchiveMeta(**data))
                except Exception as exc:
                    logger.warning("[LocalScaffoldRepository] Corrupted manifest in %s: %s", p.name, exc)

        return results

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        """경로 조작(..) 방어 및 물리적 에셋 파일 경로 해석."""
        clean_id = sanitize_scaffold_id(scaffold_id)
        archive_dir = (self.root_dir / clean_id).resolve()

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
