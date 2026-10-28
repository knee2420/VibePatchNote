"""
[02.reconstruct_v2] Tiptap 스캐폴드 재구성 실시간 시각화 스튜디오 (:8090).
비전-원자그리드 융합 정밀 와이어프레임(v2) 산출물을 실시간으로 시각화 및 검증합니다.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

try:
    import pymupdf as fitz
except ImportError:
    import fitz

# 윈도우 UTF-8 입출력 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

VIZ_DIR = Path(__file__).resolve().parent
RECON_V2_DIR = VIZ_DIR.parent
TUNING_DIR = RECON_V2_DIR.parent
PROJECT_ROOT = TUNING_DIR.parent.parent

# packages/tiptap-scaffold 스타일 경로
TIPTAP_SCAFFOLD_CSS = PROJECT_ROOT / "packages" / "tiptap-scaffold" / "src" / "styles" / "scaffold.css"

V2_OUTLINE_DIR = TUNING_DIR / "01.outline_extraction_v2"
OUTLINE_STAGING_DIR = V2_OUTLINE_DIR / "staging" / "step1_outline"
RAW_DATASET_DIR = V2_OUTLINE_DIR / "01.dataset" / "raw"
STAGING_DIR = RECON_V2_DIR / "staging"

sys.path.insert(0, str(RECON_V2_DIR))

from pipeline.reconstructor import ScaffoldReconstructorV2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ReconstructStudioV2")

app = FastAPI(title="Tiptap Scaffold Reconstruct Studio v2 (Vision-Grid)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_INDEX = VIZ_DIR / "static" / "index.html"
reconstructor = ScaffoldReconstructorV2(model="gemini-3.8-flash-low")


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    if not STATIC_INDEX.exists():
        raise HTTPException(status_code=404, detail="Studio UI not found.")
    return FileResponse(STATIC_INDEX)


@app.get("/static/scaffold.css")
async def serve_scaffold_css():
    """packages/tiptap-scaffold의 실제 CSS를 직접 서빙하여 100% 디자인 동기화."""
    if not TIPTAP_SCAFFOLD_CSS.exists():
        raise HTTPException(status_code=404, detail="scaffold.css not found in packages.")
    return FileResponse(TIPTAP_SCAFFOLD_CSS, media_type="text/css")


STORAGE_DOCS_DIR = PROJECT_ROOT / "apps" / "api" / "storage" / "documents"
UPLOADS_DIR = PROJECT_ROOT / "apps" / "api" / "uploads"


def find_pdf_path(doc_id: str) -> Optional[Path]:
    """doc_id에 대응하는 원본 PDF 경로를 다중 후보지에서 스마트 탐색."""
    candidates = [
        RAW_DATASET_DIR / f"{doc_id}.pdf",
        RAW_DATASET_DIR / f"{doc_id.replace('_', ' ')}.pdf",
        UPLOADS_DIR / f"{doc_id}.pdf",
        UPLOADS_DIR / f"{doc_id.replace('_', ' ')}.pdf",
    ]
    for c in candidates:
        if c.exists():
            return c
    clean_id = doc_id.replace("_", "").replace(" ", "").lower()
    for search_dir in [RAW_DATASET_DIR, UPLOADS_DIR]:
        if search_dir.exists():
            for p in search_dir.glob("*.pdf"):
                if clean_id in p.stem.replace("_", "").replace(" ", "").lower():
                    return p
    return None


@app.get("/api/documents")
async def list_documents():
    """사용 가능한 문서 목록 반환 (v2 Staging 우선 표시)."""
    docs = []
    seen_ids = set()

    # 1. v2 Staging 문서 우선 등록
    if STAGING_DIR.exists():
        for p in sorted(STAGING_DIR.glob("scaffold_v2_*.json")):
            stem = p.stem.replace("scaffold_v2_", "")
            pdf_path = find_pdf_path(stem)
            seen_ids.add(stem)
            docs.append({
                "id": stem,
                "filename": f"{stem}.pdf",
                "has_pdf": pdf_path is not None and pdf_path.exists(),
                "size_kb": round(p.stat().st_size / 1024, 1),
                "source": "v2_staging (Vision)",
            })

    # 2. Outline Staging 추가
    if OUTLINE_STAGING_DIR.exists():
        for p in sorted(OUTLINE_STAGING_DIR.glob("output_*.json")):
            stem = p.stem.replace("output_", "")
            if stem not in seen_ids:
                pdf_path = find_pdf_path(stem)
                seen_ids.add(stem)
                docs.append({
                    "id": stem,
                    "filename": f"{stem}.pdf",
                    "has_pdf": pdf_path is not None and pdf_path.exists(),
                    "size_kb": round(p.stat().st_size / 1024, 1),
                    "source": "staging",
                })

    return {"documents": docs}


@app.get("/api/document/{doc_id}/reconstruct")
async def get_reconstructed_data(doc_id: str):
    """지정된 문서의 v2 비전 재구성 Tiptap Scaffold 산출물 반환."""
    pdf_path = find_pdf_path(doc_id)
    clean_id = doc_id.replace("_", "").replace(" ", "").lower()

    # 1. v2 산출물 우선 로드
    scaffold_dict = None
    if STAGING_DIR.exists():
        for p in STAGING_DIR.glob("scaffold_v2_*.json"):
            p_clean = p.stem.replace("scaffold_v2_", "").replace("_", "").replace(" ", "").lower()
            if clean_id == p_clean or clean_id in p_clean or p_clean in clean_id:
                try:
                    scaffold_dict = json.loads(p.read_text(encoding="utf-8"))
                    break
                except Exception:
                    pass

    # 2. 산출물이 없으면 실시간 v2 재구성 실행
    if not scaffold_dict:
        if not pdf_path or not pdf_path.exists():
            raise HTTPException(status_code=404, detail=f"Neither v2 scaffold JSON nor PDF found for: {doc_id}")
        try:
            res = reconstructor.reconstruct(str(pdf_path), force_fresh=False)
            scaffold_dict = res.model_dump(by_alias=True)
        except Exception as e:
            logger.error("Failed to reconstruct v2 %s: %s", doc_id, e, exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    # Tiptap DOM 인라인 스타일 주입
    from pipeline.hydrator import hydrate_scaffold_html
    raw_html = scaffold_dict.get("htmlContent", "")
    scaffold_dict["htmlContent"] = hydrate_scaffold_html(raw_html)

    return {
        "document_id": doc_id,
        "outline": {},
        "scaffold": scaffold_dict,
    }


@app.get("/api/document/{doc_id}/page-image/{page_num}")
async def get_page_image(doc_id: str, page_num: int):
    """원본 PDF 페이지의 고해상도 렌더링 이미지 제공."""
    pdf_path = find_pdf_path(doc_id)
    if not pdf_path or not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF not found for: {doc_id}")

    doc = fitz.open(pdf_path)
    if page_num < 1 or page_num > len(doc):
        doc.close()
        raise HTTPException(status_code=400, detail="Page number out of range")

    page = doc[page_num - 1]
    pix = page.get_pixmap(dpi=144, alpha=False)
    png_bytes = pix.tobytes("png")
    doc.close()

    return Response(content=png_bytes, media_type="image/png")


@app.get("/api/document/{doc_id}/scaffold-image/{page_num}")
async def get_scaffold_image(doc_id: str, page_num: int):
    """비전 검증용: 재구성된 scaffold.html 을 PyMuPDF 로 렌더링한 고해상도 PNG 이미지 제공."""
    data = await get_reconstructed_data(doc_id)
    html_content = data["scaffold"].get("htmlContent", "")
    if not html_content:
        raise HTTPException(status_code=404, detail="No scaffold HTML found")

    import importlib.util
    spec = importlib.util.spec_from_file_location("sr", str(TUNING_DIR / "02.reconstruct" / "vision" / "scaffold_renderer.py"))
    sr = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sr)

    # 1페이지 분리
    if "\n\n<div data-type=\"scaffold-page\"" in html_content:
        pages = html_content.split("\n\n<div data-type=\"scaffold-page\"")
        p_html = pages[0] if page_num == 1 and not pages[0].startswith("<div data-type=\"scaffold-page\"") else (
            ("<div data-type=\"scaffold-page\"" + pages[page_num - 1]) if page_num > 1 else pages[0]
        )
    else:
        p_html = html_content

    png_bytes = sr.render_scaffold_png(p_html, dpi=144)
    if not png_bytes:
        raise HTTPException(status_code=500, detail="Failed to render scaffold PNG")

    return Response(content=png_bytes, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    print("=" * 68)
    print("  [*] VibePatchNote — Tiptap Scaffold Reconstruct Studio v2 (Vision-Grid)")
    print("  [*] URL: http://localhost:8090")
    print("  [*] Staging: workbench/05.llm_tuning/02.reconstruct_v2/staging (Vision 산출물)")
    print("=" * 68)
    uvicorn.run(app, host="127.0.0.1", port=8090, log_level="info")
