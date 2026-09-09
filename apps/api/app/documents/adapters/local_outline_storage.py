"""아웃라인 및 엘리먼트 데이터의 디스크 스토리지 영속화 관리자 (SSOT).

저장 경로 규격:
storage/outlines/{doc_slug}/ 또는 통합 문서 패키지(document_storage)
  ├── manifest.json      (메타데이터: 제목, 페이지수, 노드수, 생성일시, 모델)
  ├── outline_tree.json  (계층 아웃라인 트리 + 소속 엘리먼트 전체 JSON)
  ├── elements.json      (뷰어 하이라이트용 평면 엘리먼트 배열)
  └── outline.md         (마크다운 형태의 가독성 목차)
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.storage.document_storage import document_storage, slugify_document_name

logger = logging.getLogger(__name__)


def slugify_filename(filename: str) -> str:
    """파일명에서 안전한 디렉터리 식별자(slug)를 만듭니다."""
    return slugify_document_name(filename)


class OutlineStorageRepository:
    """
    아웃라인 및 엘리먼트 추출 결과물의 영속화(저장 및 로드)를 전담하는 레포지토리 (Facade Adapter).
    
    신규 통합 문서 패키지(document_storage.package.outline)를 단일 진실 공급원(SSOT)으로 사용하되,
    이전 버전(storage/outlines/{slug})과의 하위 호환성을 투명하게 유지합니다.
    """

    def __init__(self, base_dir: Optional[Path] = None) -> None:
        self.base_dir = base_dir or settings.outline_storage_dir

    def get_document_dir(self, filename: str) -> Path:
        """신규 통합 스토리지의 outline 디렉터리를 기본 경로로 반환합니다."""
        pkg = document_storage.get_package(filename)
        return pkg.outline.outline_dir

    def exists(self, filename: str) -> bool:
        pkg = document_storage.get_package(filename)
        if pkg.outline.exists():
            return True
        # 레거시 폴백 검사
        legacy_dir = self.base_dir / slugify_filename(filename)
        return (legacy_dir / "manifest.json").exists() and (
            (legacy_dir / "outline_tree.json").exists() or (legacy_dir / "tree.json").exists()
        )

    def save_outline_document(self, filename: str, doc: Any) -> Path:
        """scaffold-engine의 OutlineDocument 인스턴스를 통합 스토리지에 영속화합니다."""
        pkg = document_storage.get_package(filename)
        pkg.ensure()

        total_pages = getattr(doc, "total_pages", 1)
        outlines = getattr(doc, "outlines", [])
        flat_elements = getattr(doc, "flat_elements", [])
        markdown_outline = getattr(doc, "markdown_outline", "")

        outlines_data = [
            n.model_dump(by_alias=True) if hasattr(n, "model_dump") else n
            for n in outlines
        ]
        elements_data = [
            e.model_dump(by_alias=True) if hasattr(e, "model_dump") else e
            for e in flat_elements
        ]

        # 1. 아웃라인 및 엘리먼트 통합 저장
        outline_dir = pkg.outline.save(
            document_title=filename,
            total_pages=total_pages,
            outlines=outlines_data,
            elements=elements_data,
            markdown_outline=markdown_outline,
            model=settings.agent_cli_model,
        )

        # 2. 문서 패키지 전역 manifest 갱신
        now_iso = datetime.now(timezone.utc).isoformat()
        pkg.save_manifest({
            "document_title": filename,
            "source_file_name": filename,
            "total_pages": total_pages,
            "has_outline": True,
            "updated_at": now_iso,
        })

        logger.info("[storage] 통합 문서 스토리지 영속화 완료: %s", outline_dir.resolve())
        return outline_dir

    def load(self, filename: str) -> Optional[Dict[str, Any]]:
        """저장된 아웃라인 패키지를 로드합니다 (신규 통합 스토리지 우선, 레거시 폴백)."""
        pkg = document_storage.get_package(filename)
        data = pkg.outline.load()
        if data:
            return data

        # 레거시 폴백 로드
        legacy_dir = self.base_dir / slugify_filename(filename)
        manifest_file = legacy_dir / "manifest.json"
        tree_file = legacy_dir / "outline_tree.json"
        if not tree_file.exists():
            tree_file = legacy_dir / "tree.json"
        elements_file = legacy_dir / "elements.json"
        md_file = legacy_dir / "outline.md"

        if not (manifest_file.exists() and tree_file.exists()):
            return None

        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            with open(tree_file, "r", encoding="utf-8") as f:
                tree_data = json.load(f)

            elements = []
            if elements_file.exists():
                with open(elements_file, "r", encoding="utf-8") as f:
                    elements = json.load(f)

            markdown_outline = ""
            if md_file.exists():
                with open(md_file, "r", encoding="utf-8") as f:
                    markdown_outline = f.read()

            # 읽어온 레거시 데이터를 신규 패키지로 자동 승격 (마이그레이션)
            try:
                pkg.outline.save(
                    document_title=manifest.get("document_title", filename),
                    total_pages=manifest.get("total_pages", 1),
                    outlines=tree_data.get("outlines", []),
                    elements=elements,
                    markdown_outline=markdown_outline,
                    model=manifest.get("model"),
                )
                logger.info("[OutlineStorage] Migrated legacy outline to document package: %s", filename)
            except Exception as mig_err:
                logger.warning("[OutlineStorage] Auto-migration skipped: %s", mig_err)

            return {
                "manifest": manifest,
                "outlines": tree_data.get("outlines", []),
                "elements": elements,
                "markdown_outline": markdown_outline,
            }
        except Exception as exc:
            logger.error("스토리지 로드 실패 (%s): %s", filename, exc)
            return None

