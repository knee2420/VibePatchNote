"""
[02.reconstruct] Tiptap 스캐폴드 재구성 실시간 시각화 스튜디오 (:8090).
Outline 정보를 기반으로 재구성된 Tiptap HTML / 마크다운 / 슬롯 매핑을
실제 packages/tiptap-scaffold CSS와 100% 동기화하여 시각적으로 검증합니다.
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
RECON_DIR = VIZ_DIR.parent
TUNING_DIR = RECON_DIR.parent
PROJECT_ROOT = TUNING_DIR.parent.parent

# packages/tiptap-scaffold 스타일 경로
TIPTAP_SCAFFOLD_CSS = PROJECT_ROOT / "packages" / "tiptap-scaffold" / "src" / "styles" / "scaffold.css"

V2_DIR = TUNING_DIR / "01.outline_extraction_v2"
OUTLINE_STAGING_DIR = V2_DIR / "staging" / "step1_outline"
RAW_DATASET_DIR = V2_DIR / "01.dataset" / "raw"

sys.path.insert(0, str(RECON_DIR))
from pipeline.reconstructor import ScaffoldReconstructor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ReconstructStudio")

app = FastAPI(title="Tiptap Scaffold Reconstruct Studio", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_INDEX = VIZ_DIR / "static" / "index.html"
reconstructor = ScaffoldReconstructor()


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
    # 부분 매칭
    clean_id = doc_id.replace("_", "").replace(" ", "").lower()
    for search_dir in [RAW_DATASET_DIR, UPLOADS_DIR]:
        if search_dir.exists():
            for p in search_dir.glob("*.pdf"):
                if clean_id in p.stem.replace("_", "").replace(" ", "").lower():
                    return p
    return None


@app.get("/api/documents")
async def list_documents():
    """사용 가능한 문서 목록 반환 (Staging 및 Storage 결합)."""
    docs = []
    seen_ids = set()

    # 1. Staging 문서 탐색
    if OUTLINE_STAGING_DIR.exists():
        for p in sorted(OUTLINE_STAGING_DIR.glob("output_*.json")):
            stem = p.stem.replace("output_", "")
            pdf_path = find_pdf_path(stem)
            seen_ids.add(stem)
            docs.append({
                "id": stem,
                "filename": f"{stem}.pdf",
                "has_pdf": pdf_path is not None and pdf_path.exists(),
                "size_kb": round(p.stat().st_size / 1024, 1),
                "source": "staging",
            })

    # 2. Storage 문서 탐색 (미등록 항목 보강)
    if STORAGE_DOCS_DIR.exists():
        for d in sorted(STORAGE_DOCS_DIR.iterdir()):
            if d.is_dir() and (d / "outline" / "outline_tree.json").exists():
                stem = d.name.replace(" ", "_").replace("__", "_")
                if stem not in seen_ids:
                    pdf_path = find_pdf_path(stem)
                    seen_ids.add(stem)
                    outline_file = d / "outline" / "outline_tree.json"
                    docs.append({
                        "id": stem,
                        "filename": f"{stem}.pdf",
                        "has_pdf": pdf_path is not None and pdf_path.exists(),
                        "size_kb": round(outline_file.stat().st_size / 1024, 1),
                        "source": "storage",
                    })

    return {"documents": docs}


@app.get("/api/document/{doc_id}/reconstruct")
async def get_reconstructed_data(doc_id: str):
    """지정된 문서의 Outline 데이터와 재구성된 Tiptap Scaffold 산출물 반환."""
    pdf_path = find_pdf_path(doc_id)
    scaffold_staging_file = RECON_DIR / "staging" / f"scaffold_{doc_id}.json"
    
    # 1. Outline 데이터 로드
    outline_data = {}
    outline_file = OUTLINE_STAGING_DIR / f"output_{doc_id}.json"
    if not outline_file.exists():
        storage_file = STORAGE_DOCS_DIR / doc_id / "outline" / "outline_tree.json"
        if not storage_file.exists():
            storage_file = STORAGE_DOCS_DIR / doc_id.replace("_", " ") / "outline" / "outline_tree.json"
        if storage_file.exists():
            outline_file = storage_file
    if outline_file.exists():
        try:
            outline_data = json.loads(outline_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    # 2. Scaffold 산출물 로드 또는 실시간 생성
    scaffold_dict = None
    staging_candidates = [
        RECON_DIR / "staging" / f"scaffold_{doc_id}.json",
        RECON_DIR / "staging" / f"scaffold_{doc_id.replace('_', ' ')}.json",
        RECON_DIR / "staging" / f"scaffold_{doc_id.replace(' ', '_')}.json",
    ]
    # 추가로 클린 네임 매칭 탐색
    clean_id = doc_id.replace("_", "").replace(" ", "").lower()
    staging_dir = RECON_DIR / "staging"
    if staging_dir.exists():
        for p in staging_dir.glob("scaffold_*.json"):
            p_clean = p.stem.replace("scaffold_", "").replace("_", "").replace(" ", "").lower()
            if clean_id == p_clean or clean_id in p_clean or p_clean in clean_id:
                if p not in staging_candidates:
                    staging_candidates.append(p)

    # 후보군 중 가장 풍부한 슬롯(slots count)을 보유한 파일 우선 선택
    best_candidate = None
    max_slots = -1
    for cand in staging_candidates:
        if cand.exists():
            try:
                data = json.loads(cand.read_text(encoding="utf-8"))
                slots_count = len(data.get("slots", []))
                if slots_count > max_slots:
                    max_slots = slots_count
                    best_candidate = data
            except Exception:
                pass

    if best_candidate and max_slots > 1:
        scaffold_dict = best_candidate
    elif best_candidate and not pdf_path:
        scaffold_dict = best_candidate

    if not scaffold_dict:
        if not pdf_path or not pdf_path.exists():
            raise HTTPException(status_code=404, detail=f"Neither scaffold JSON nor PDF found for: {doc_id}")
        try:
            scaffold_res = reconstructor.reconstruct(pdf_path, doc_id=doc_id)
            scaffold_dict = scaffold_res.model_dump(by_alias=True)
            scaffold_staging_file.write_text(json.dumps(scaffold_dict, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error("Failed to reconstruct %s: %s", doc_id, e, exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    # Tiptap DOM 인라인 스타일 완전 주입 (Hydration)
    from pipeline.hydrator import hydrate_scaffold_html
    raw_html = scaffold_dict.get("htmlContent", "")
    scaffold_dict["htmlContent"] = hydrate_scaffold_html(raw_html)

    return {
        "document_id": doc_id,
        "outline": outline_data,
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

    from vision.scaffold_renderer import render_scaffold_png
    png_bytes = render_scaffold_png(html_content, dpi=144)
    if not png_bytes:
        raise HTTPException(status_code=500, detail="Failed to render scaffold PNG")

    return Response(content=png_bytes, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    print("=" * 68)
    print("  [*] VibePatchNote — Tiptap Scaffold Reconstruct Studio (02.reconstruct)")
    print("  [*] URL: http://localhost:8090")
    print("  [*] CSS: packages/tiptap-scaffold/src/styles/scaffold.css 연동")
    print("=" * 68)
    uvicorn.run(app, host="127.0.0.1", port=8090, log_level="info")
