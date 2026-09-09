"""문서 중심(Document-Centric) 통합 영속화 계층 (SSOT & Loose Coupling).

도메인 및 기능별로 파편화되어 있던 저장소들을 단일 문서 패키지 단위로 통합 관리합니다.

디렉터리 규격:
storage/documents/{doc_slug}/
  ├── manifest.json       (문서 통합 메타데이터)
  ├── vision/             (공통 비전 렌더링 캐시: page_{n}.png, geometry.json)
  ├── outline/            (아웃라인 & 엘리먼트: tree.json, elements.json, outline.md)
  ├── segments/           (세그먼트 캐시: segments.json)
  └── scaffolds/          (스캐폴드 아티팩트들)
        └── {scaffold_id}/
              ├── manifest.json
              ├── scaffold.html / render.html
              ├── content.md / render.md
              └── slots.json
"""
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def slugify_document_name(name: str) -> str:
    """문서 파일명에서 일관되고 안전한 디렉터리 식별자(slug)를 생성합니다."""
    stem = Path(name).stem
    clean = re.sub(r"[^\w\s\uAC00-\uD7A3.-]", "", stem)
    return clean.strip().replace(" ", "_") or "doc"


class DocumentVisionStorage:
    """문서의 공통 실측 기하 및 페이지 렌더링 이미지 캐시 전담 핸들러."""

    def __init__(self, vision_dir: Path) -> None:
        self.vision_dir = vision_dir

    def _ensure(self) -> Path:
        self.vision_dir.mkdir(parents=True, exist_ok=True)
        return self.vision_dir

    def save_page_image(self, page_number: int, png_bytes: bytes) -> Path:
        self._ensure()
        target = self.vision_dir / f"page_{page_number}.png"
        target.write_bytes(png_bytes)
        return target

    def get_page_image(self, page_number: int) -> Optional[Path]:
        target = self.vision_dir / f"page_{page_number}.png"
        return target if target.exists() else None

    def save_geometry(self, geometry_data: Dict[str, Any]) -> None:
        self._ensure()
        target = self.vision_dir / "geometry.json"
        with open(target, "w", encoding="utf-8") as f:
            json.dump(geometry_data, f, ensure_ascii=False, indent=2)

    def load_geometry(self) -> Optional[Dict[str, Any]]:
        target = self.vision_dir / "geometry.json"
        if not target.exists():
            return None
        try:
            with open(target, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning("[VisionStorage] Failed to read geometry.json: %s", exc)
            return None


class DocumentOutlineStorage:
    """문서의 아웃라인 목차 및 엘리먼트 트리 전담 핸들러."""

    def __init__(self, outline_dir: Path) -> None:
        self.outline_dir = outline_dir

    def _ensure(self) -> Path:
        self.outline_dir.mkdir(parents=True, exist_ok=True)
        return self.outline_dir

    def exists(self) -> bool:
        manifest = self.outline_dir / "manifest.json"
        tree = self.outline_dir / "outline_tree.json"
        alt_tree = self.outline_dir / "tree.json"
        return manifest.exists() and (tree.exists() or alt_tree.exists())

    def save(
        self,
        document_title: str,
        total_pages: int,
        outlines: List[Dict[str, Any]],
        elements: List[Dict[str, Any]],
        markdown_outline: str,
        model: Optional[str] = None,
    ) -> Path:
        self._ensure()
        now_iso = datetime.now(timezone.utc).isoformat()

        manifest = {
            "outline_id": f"outline-{slugify_document_name(document_title)}",
            "document_title": document_title,
            "source_file_name": document_title,
            "total_pages": total_pages,
            "total_outlines": len(outlines),
            "total_elements": len(elements),
            "created_at": now_iso,
            "status": "completed",
            "model": model or settings.agent_cli_model,
        }
        with open(self.outline_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        tree_data = {
            "document_title": document_title,
            "total_pages": total_pages,
            "outlines": outlines,
        }
        # 호환성을 위해 outline_tree.json을 정본으로 저장하고 tree.json도 저장
        with open(self.outline_dir / "outline_tree.json", "w", encoding="utf-8") as f:
            json.dump(tree_data, f, ensure_ascii=False, indent=2)

        with open(self.outline_dir / "elements.json", "w", encoding="utf-8") as f:
            json.dump(elements, f, ensure_ascii=False, indent=2)

        with open(self.outline_dir / "outline.md", "w", encoding="utf-8") as f:
            f.write(markdown_outline)

        return self.outline_dir

    def load(self) -> Optional[Dict[str, Any]]:
        manifest_file = self.outline_dir / "manifest.json"
        tree_file = self.outline_dir / "outline_tree.json"
        if not tree_file.exists():
            tree_file = self.outline_dir / "tree.json"
        elements_file = self.outline_dir / "elements.json"
        md_file = self.outline_dir / "outline.md"

        if not (manifest_file.exists() and tree_file.exists()):
            return None

        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            with open(tree_file, "r", encoding="utf-8") as f:
                tree = json.load(f)

            elements = []
            if elements_file.exists():
                with open(elements_file, "r", encoding="utf-8") as f:
                    elements = json.load(f)

            md = ""
            if md_file.exists():
                with open(md_file, "r", encoding="utf-8") as f:
                    md = f.read()

            return {
                "manifest": manifest,
                "outlines": tree.get("outlines", []),
                "elements": elements,
                "markdown_outline": md,
            }
        except Exception as exc:
            logger.error("[OutlineStorage] Load failed: %s", exc)
            return None


class DocumentSegmentsStorage:
    """문서의 평면 바운딩 박스 세그먼트 캐시 전담 핸들러 (uploads 폴더 오염 방지)."""

    def __init__(self, segments_dir: Path) -> None:
        self.segments_dir = segments_dir

    def _ensure(self) -> Path:
        self.segments_dir.mkdir(parents=True, exist_ok=True)
        return self.segments_dir

    def exists(self) -> bool:
        return (self.segments_dir / "segments.json").exists()

    def save(self, data: Dict[str, Any]) -> None:
        self._ensure()
        with open(self.segments_dir / "segments.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load(self) -> Optional[Dict[str, Any]]:
        target = self.segments_dir / "segments.json"
        if not target.exists():
            return None
        try:
            with open(target, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning("[SegmentsStorage] Load failed: %s", exc)
            return None


class DocumentPackage:
    """
    단일 문서 단위의 종합 패키지 프록시.
    
    모든 하위 저장소(vision, outline, segments, scaffolds)를 캡슐화하여 제공합니다.
    """

    def __init__(self, root_dir: Path, doc_slug: str) -> None:
        self.root_dir = root_dir
        self.doc_slug = doc_slug
        self.package_dir = (root_dir / doc_slug).resolve()

        self.vision = DocumentVisionStorage(self.package_dir / "vision")
        self.outline = DocumentOutlineStorage(self.package_dir / "outline")
        self.segments = DocumentSegmentsStorage(self.package_dir / "segments")
        self.scaffolds_dir = self.package_dir / "scaffolds"

    def ensure(self) -> Path:
        self.package_dir.mkdir(parents=True, exist_ok=True)
        return self.package_dir

    def exists(self) -> bool:
        return self.package_dir.exists()

    def get_manifest(self) -> Optional[Dict[str, Any]]:
        manifest_path = self.package_dir / "manifest.json"
        if not manifest_path.exists():
            return None
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def save_manifest(self, meta: Dict[str, Any]) -> None:
        self.ensure()
        manifest_path = self.package_dir / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)


class DocumentStorageManager:
    """
    문서 스토리지 최상위 레포지토리 (Facade 패턴).
    
    각 도메인은 이 매니저를 통해 문서 패키지를 획득하여 작업하므로,
    물리 파일시스템 경로와 하위 폴더 네이밍에 대한 결합도가 완전히 제거됩니다.
    """

    def __init__(self, root_dir: Optional[Path] = None) -> None:
        self.root_dir = root_dir or settings.documents_storage_dir

    def _ensure(self) -> Path:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        return self.root_dir

    def get_package(self, filename_or_slug: str) -> DocumentPackage:
        slug = slugify_document_name(filename_or_slug)
        return DocumentPackage(self.root_dir, slug)

    def list_documents(self) -> List[str]:
        if not self.root_dir.exists():
            return []
        return [p.name for p in self.root_dir.iterdir() if p.is_dir()]

    def find_scaffold_dir(self, scaffold_id: str) -> Optional[Path]:
        """모든 문서 패키지 내에서 scaffold_id에 해당하는 디렉터리를 탐색합니다."""
        if not self.root_dir.exists():
            return None
        for doc_dir in self.root_dir.iterdir():
            if not doc_dir.is_dir():
                continue
            candidate = doc_dir / "scaffolds" / scaffold_id
            if candidate.exists() and (candidate / "manifest.json").exists():
                return candidate
        return None

    def find_all_scaffold_dirs(self) -> List[Path]:
        """모든 문서 패키지 하위의 유효한 스캐폴드 디렉터리들을 수집합니다."""
        if not self.root_dir.exists():
            return []
        results: List[Path] = []
        for doc_dir in self.root_dir.iterdir():
            if not doc_dir.is_dir():
                continue
            scaffolds_dir = doc_dir / "scaffolds"
            if scaffolds_dir.exists() and scaffolds_dir.is_dir():
                for sc_dir in scaffolds_dir.iterdir():
                    if sc_dir.is_dir() and (sc_dir / "manifest.json").exists():
                        results.append(sc_dir)
        return results


document_storage = DocumentStorageManager()
