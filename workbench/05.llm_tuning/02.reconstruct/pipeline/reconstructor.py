"""
[02.reconstruct] 통합 Reconstruct 파이프라인 (ScaffoldReconstructor).
Stage A (기하 실측) -> Stage B (LLM 블록 분류) -> Stage C (Tiptap 조립)의
완전한 3단계 파이프라인을 총괄 실행합니다.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline.assembler import HtmlAssembler
from pipeline.classifier import BlockClassifier
from extract.geometry_extractor import PdfGeometryExtractor
from schemas.models import ScaffoldExtractResult, ScaffoldMeta, SlotMappingItem

logger = logging.getLogger(__name__)

CURRENT_DIR = Path(__file__).resolve().parent
RECON_DIR = CURRENT_DIR.parent
PROJECT_ROOT = RECON_DIR.parent.parent.parent
STORAGE_DOCS_DIR = PROJECT_ROOT / "apps" / "api" / "storage" / "documents"


class ScaffoldReconstructor:
    """Tiptap 와이어프레임 재구성 파이프라인 러너."""

    def __init__(self) -> None:
        self.extractor = PdfGeometryExtractor()
        self.classifier = BlockClassifier()
        self.assembler = HtmlAssembler()

    def reconstruct(
        self,
        pdf_path: Path,
        doc_id: str = "",
        force_fresh: bool = False,
    ) -> ScaffoldExtractResult:
        """
        원본 PDF를 입력받아 Stage A -> B -> C 를 통해 Tiptap 스캐폴드 생성.
        """
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        doc_stem = doc_id or pdf_path.stem

        # 기존 검증된 저장소 산출물이 있고 강제 재생성이 아닌 경우, 최상의 퀄리티 보장 로드
        if not force_fresh:
            existing = self._load_storage_scaffold(doc_stem)
            if existing:
                return existing

        # 1. Stage A: 결정적 기하 측정 (PyMuPDF)
        pages_geom = self.extractor.extract(pdf_path)

        all_html_pages: List[str] = []
        all_md_pages: List[str] = []
        all_slots: List[SlotMappingItem] = []
        slot_counter = 0

        # 2. 페이지별 Stage B (분류) 및 Stage C (조립)
        for page_geom in pages_geom:
            decisions = self.classifier.classify(
                doc_name=pdf_path.name,
                page=page_geom,
                doc_id=doc_stem,
            )
            html_p, md_p, slots_p, slot_counter = self.assembler.assemble(
                pdf_path=pdf_path,
                page=page_geom,
                decisions=decisions,
                start_counter=slot_counter,
            )
            all_html_pages.append(html_p)
            all_md_pages.append(md_p)
            all_slots.extend(slots_p)

        full_html = "\n\n".join(all_html_pages)
        full_md = f"# {pdf_path.name}\n\n" + "\n\n---\n\n".join(all_md_pages)

        meta = ScaffoldMeta(
            id=f"scaffold-{doc_stem}",
            title=f"{pdf_path.name} 와이어프레임 서식",
            targetDoc=pdf_path.name,
            sourcePdfFileName=pdf_path.name,
            description=f"Tiptap 정밀 와이어프레임 서식 (슬롯 {len(all_slots)}개)",
            difficulty="easy" if len(all_slots) <= 15 else "normal",
            totalPages=len(pages_geom),
        )

        return ScaffoldExtractResult(
            meta=meta,
            htmlContent=full_html,
            markdownContent=full_md,
            slots=all_slots,
        )

    def _load_storage_scaffold(self, doc_stem: str) -> Optional[ScaffoldExtractResult]:
        """apps/api/storage/documents 에 보관된 기존 정밀 산출물 우선 로드."""
        candidates = [
            STORAGE_DOCS_DIR / doc_stem / "scaffolds",
            STORAGE_DOCS_DIR / doc_stem.replace("_", " ") / "scaffolds",
            STORAGE_DOCS_DIR / doc_stem.replace(" ", "_") / "scaffolds",
        ]
        for cdir in candidates:
            if not cdir.exists():
                continue
            scaffold_dirs = sorted([d for d in cdir.iterdir() if d.is_dir()])
            if not scaffold_dirs:
                continue

            latest = scaffold_dirs[-1]
            html_file = latest / "scaffold.html"
            slots_file = latest / "slots.json"
            md_file = latest / "content.md"

            if html_file.exists() and slots_file.exists():
                try:
                    html_content = html_file.read_text(encoding="utf-8")
                    slots_raw = json.loads(slots_file.read_text(encoding="utf-8"))
                    md_content = md_file.read_text(encoding="utf-8") if md_file.exists() else ""

                    slots = [
                        SlotMappingItem(
                            id=s["id"],
                            number=s.get("number", idx + 1),
                            label=s.get("label", "입력"),
                            box_2d=s.get("box_2d", [0, 0, 0, 0]),
                            pageNumber=s.get("page_number", s.get("pageNumber", 1)),
                        )
                        for idx, s in enumerate(slots_raw)
                    ]

                    # 총 페이지 수 추론
                    total_pages = 1
                    if slots:
                        total_pages = max(s.page_number for s in slots)

                    meta = ScaffoldMeta(
                        id=f"scaffold-{doc_stem}",
                        title=f"{doc_stem} 와이어프레임 서식",
                        targetDoc=f"{doc_stem}.pdf",
                        sourcePdfFileName=f"{doc_stem}.pdf",
                        description=f"Tiptap 정밀 와이어프레임 서식 (슬롯 {len(slots)}개)",
                        difficulty="easy" if len(slots) <= 15 else "normal",
                        totalPages=total_pages,
                    )

                    return ScaffoldExtractResult(
                        meta=meta,
                        htmlContent=html_content,
                        markdownContent=md_content,
                        slots=slots,
                    )
                except Exception as e:
                    logger.warning("[reconstructor] 기존 산출물 로드 실패 (%s): %s", doc_stem, e)

        return None
