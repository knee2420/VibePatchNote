"""
[02.reconstruct_v2] 통합 파이프라인 러너 (ScaffoldReconstructorV2).
비전 멀티모달 모델과 PyMuPDF 정밀 기하 힌트를 결합하여 완벽한 와이어프레임을 총괄 생성합니다.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from harness.llm_client import V2LlmClient
from pipeline.assembler import V2Assembler
from pipeline.extractor import V2GeometryExtractor
from pipeline.hydrator import hydrate_scaffold_html
from schemas.models import ScaffoldExtractResult, ScaffoldMeta, SlotMappingItem

logger = logging.getLogger(__name__)

CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
TUNING_DIR = MODULE_DIR.parent
RAW_PDF_DIR = TUNING_DIR / "01.outline_extraction_v2" / "01.dataset" / "raw"
PROJECT_ROOT = TUNING_DIR.parent.parent
UPLOADS_DIR = PROJECT_ROOT / "apps" / "api" / "uploads"
STAGING_DIR = MODULE_DIR / "staging"
TEMP_IMG_DIR = MODULE_DIR / "temp_images"


class ScaffoldReconstructorV2:
    """v2 비전 중심 통합 재구성 러너."""

    def __init__(self, model: str = "gemini-3.8-flash-low") -> None:
        self.extractor = V2GeometryExtractor()
        self.client = V2LlmClient(model=model)
        self.assembler = V2Assembler()
        STAGING_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_IMG_DIR.mkdir(parents=True, exist_ok=True)

    def reconstruct(self, doc_id_or_path: str, force_fresh: bool = False) -> ScaffoldExtractResult:
        pdf_path = self._resolve_pdf(doc_id_or_path)
        if not pdf_path or not pdf_path.exists():
            raise FileNotFoundError(f"[reconstructor_v2] PDF 파일을 찾을 수 없습니다: {doc_id_or_path}")

        doc_stem = pdf_path.stem
        staging_file = STAGING_DIR / f"scaffold_v2_{doc_stem}.json"

        # 캐시가 있고 force_fresh 가 아니면 로드
        if not force_fresh and staging_file.exists():
            try:
                data = json.loads(staging_file.read_text(encoding="utf-8"))
                return ScaffoldExtractResult(**data)
            except Exception:
                pass

        doc = fitz.open(pdf_path)
        all_html_pages: List[str] = []
        all_md_pages: List[str] = []
        all_slots: List[SlotMappingItem] = []
        slot_counter = 0

        try:
            for pno in range(1, len(doc) + 1):
                page = doc[pno - 1]

                # 1. 기하 및 힌트 추출
                page_geom = self.extractor.extract_page(page, pno)
                hint_text = page_geom.render_hint_text()

                # 2. 비전 멀티모달 분석 (이미지 + 기하 힌트)
                vision_out = self.client.analyze_page(
                    doc_name=pdf_path.name,
                    page_num=pno,
                    page_obj=page,
                    hint_text=hint_text,
                    temp_dir=TEMP_IMG_DIR / doc_stem,
                )

                # 3. Tiptap 와이어프레임 조립
                p_html, p_md, p_slots, slot_counter = self.assembler.assemble_page(
                    page_geom=page_geom,
                    vision_output=vision_out,
                    page_obj=page,
                    start_counter=slot_counter,
                )
                all_html_pages.append(p_html)
                all_md_pages.append(p_md)
                all_slots.extend(p_slots)

        finally:
            doc.close()

        full_html = "\n\n".join(all_html_pages)
        hydrated_html = hydrate_scaffold_html(full_html)
        full_md = f"# {pdf_path.name}\n\n" + "\n\n---\n\n".join(all_md_pages)

        meta = ScaffoldMeta(
            id=f"scaffold-v2-{doc_stem}",
            title=f"{pdf_path.name} 와이어프레임 서식 (v2 Vision-Grid)",
            targetDoc=pdf_path.name,
            sourcePdfFileName=pdf_path.name,
            description=f"비전-원자그리드 융합 정밀 와이어프레임 (슬롯 {len(all_slots)}개)",
            difficulty="easy" if len(all_slots) <= 15 else "normal",
            totalPages=len(all_html_pages),
        )

        res = ScaffoldExtractResult(
            meta=meta,
            htmlContent=hydrated_html,
            markdownContent=full_md,
            slots=all_slots,
        )

        # 산출물 저장
        staging_file.write_text(json.dumps(res.model_dump(by_alias=True), ensure_ascii=False, indent=2), encoding="utf-8")
        return res

    def _resolve_pdf(self, identifier: str) -> Optional[Path]:
        p = Path(identifier)
        if p.exists():
            return p
        stem = identifier.replace(".pdf", "")
        candidates = [
            RAW_PDF_DIR / f"{stem}.pdf",
            RAW_PDF_DIR / f"{stem.replace('_', ' ')}.pdf",
            UPLOADS_DIR / f"{stem}.pdf",
            UPLOADS_DIR / f"{stem.replace('_', ' ')}.pdf",
        ]
        for c in candidates:
            if c.exists():
                return c
        clean = stem.replace("_", "").replace(" ", "").lower()
        for sdir in [RAW_PDF_DIR, UPLOADS_DIR]:
            if sdir.exists():
                for pf in sdir.glob("*.pdf"):
                    if clean in pf.stem.replace("_", "").replace(" ", "").lower():
                        return pf
        return None
