"""
VibePatchNote — Outline Extraction V2: Input Data Formation Visualizer Backend (:8089)
PDF로부터 표 기하, 미디어 기하, 타이포그래피, 원문 텍스트가 어떻게 추출되고
최종 LLM 프롬프트로 합성되는지 단계별 탭 및 2D 공간 오버레이로 제공하는 시각화 서버.
"""
from __future__ import annotations

import io
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
V2_DIR = VIZ_DIR.parent
TUNING_DIR = V2_DIR.parent
PROJECT_ROOT = TUNING_DIR.parent.parent

# V2 내부 모듈 경로 등록
sys.path.insert(0, str(V2_DIR))
from prompts.context_builder import (
    DocumentContextBuilder,
    compute_page_font_baseline,
    is_inside_any_table,
    classify_typography_signpost,
)

V2_DATASET_RAW = V2_DIR / "01.dataset" / "raw"
V1_DATASET_RAW = TUNING_DIR / "01.outline_extraction" / "01.dataset" / "raw"
RAW_DATASET_DIR = V2_DATASET_RAW if V2_DATASET_RAW.exists() else V1_DATASET_RAW

SYSTEM_INSTRUCTIONS_PATH = V2_DIR / "prompts" / "system_instructions.md"
SCHEMA_PATH = V2_DIR / "schemas" / "outline_schema.json"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataProcessViz")

app = FastAPI(title="Outline V2 Input Data Visualizer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_INDEX = VIZ_DIR / "static" / "index.html"

# 파싱 캐시 (메모리)
_DOCUMENT_CACHE: Dict[str, Dict[str, Any]] = {}


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    if not STATIC_INDEX.exists():
        raise HTTPException(status_code=404, detail="Visualization UI not found.")
    return FileResponse(STATIC_INDEX)


@app.get("/api/documents")
async def list_documents():
    """사용 가능한 원본 PDF 문서 목록 반환."""
    docs = []
    if RAW_DATASET_DIR.exists():
        for p in sorted(RAW_DATASET_DIR.glob("*.pdf")):
            docs.append({
                "id": p.stem,
                "filename": p.name,
                "size_kb": round(p.stat().st_size / 1024, 1),
            })
    return {"documents": docs}


def _extract_pdf_process_data(pdf_path: Path) -> Dict[str, Any]:
    """PDF를 열어 각 페이지별 4대 기하 및 원문 데이터를 정밀 추출하고 텍스트를 합성."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    pages: List[Dict[str, Any]] = []
    full_context_lines: List[str] = []

    for page_idx in range(total_pages):
        page = doc[page_idx]
        p_num = page_idx + 1
        pw, ph = float(page.rect.width), float(page.rect.height)
        base_font_size = compute_page_font_baseline(page)

        page_summary_lines: List[str] = [
            f"==================== [페이지 {p_num} / 총 {total_pages}페이지] ===================="
        ]

        # 1. 표(Table) 구조 메타 실측
        tables_meta: List[Dict[str, Any]] = []
        tabs_obj = []
        try:
            tabs = page.find_tables()
            if tabs and len(tabs.tables) > 0:
                tabs_obj = tabs.tables
                page_summary_lines.append("[1. 실측된 표(Table) 구조 메타]")
                for t_idx, tab in enumerate(tabs, 1):
                    x0, y0, x1, y1 = tab.bbox
                    norm_box = [
                        round(y0 / ph * 1000),
                        round(x0 / pw * 1000),
                        round(y1 / ph * 1000),
                        round(x1 / pw * 1000),
                    ]
                    prompt_repr = f"- 표 {t_idx}: 상대좌표={norm_box}, 규격={tab.col_count}열 x {tab.row_count}행"
                    tables_meta.append({
                        "table_id": t_idx,
                        "norm_bbox": norm_box,
                        "bbox_pt": [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                        "cols": tab.col_count,
                        "rows": tab.row_count,
                        "prompt_repr": prompt_repr,
                    })
                    page_summary_lines.append(prompt_repr)
                page_summary_lines.append("")
        except Exception as e:
            logger.warning("Table extraction error: %s", e)

        # 2. 이미지 / 로고 / 시각 미디어(Media) 메타 실측
        images_meta: List[Dict[str, Any]] = []
        try:
            for img_idx, img_info in enumerate(page.get_image_info(xrefs=True), 1):
                b = img_info.get("bbox")
                if b:
                    norm_box = [
                        round(b[1] / ph * 1000),
                        round(b[0] / pw * 1000),
                        round(b[3] / ph * 1000),
                        round(b[2] / pw * 1000),
                    ]
                    w = img_info.get("width", 0)
                    h = img_info.get("height", 0)
                    is_header = norm_box[0] < 250
                    pos_desc = "상단 헤더 영역" if is_header else "본문/하단 영역"
                    prompt_repr = (
                        f"- 미디어(Media) {img_idx}: 상대좌표={norm_box}, 크기={w}x{h}px ({pos_desc})"
                    )
                    images_meta.append({
                        "image_id": img_idx,
                        "norm_bbox": norm_box,
                        "bbox_pt": [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
                        "width": w,
                        "height": h,
                        "is_header": is_header,
                        "pos_desc": pos_desc,
                        "prompt_repr": prompt_repr,
                    })
            if images_meta:
                page_summary_lines.append("[2. 실측된 이미지/로고/시각 미디어(Media) 기하 메타]")
                for img in images_meta:
                    page_summary_lines.append(img["prompt_repr"])
                page_summary_lines.append("")
        except Exception as e:
            logger.warning("Image extraction error: %s", e)

        # 3. 보편적 타이포그래피 블록 실측 (폰트 통계 + 볼드 + 표 내외부 기하 연동)
        raw_blocks = page.get_text("dict").get("blocks", [])
        candidate_blocks = []
        try:
            for b in raw_blocks:
                if b.get("type") == 0:  # text block
                    for line in b.get("lines", []):
                        line_text = ""
                        max_font_size = 10.0
                        is_bold = False

                        for s in line.get("spans", []):
                            line_text += s.get("text", "") + " "
                            max_font_size = max(max_font_size, s.get("size", 10.0))
                            font_name = s.get("font", "").lower()
                            flags = s.get("flags", 0)
                            if (flags & 2 != 0) or any(k in font_name for k in ["bold", "heavy", "black", "bld"]):
                                is_bold = True

                        line_text = line_text.strip()
                        if not line_text:
                            continue

                        lx0, ly0, lx1, ly1 = line.get("bbox", [0, 0, 0, 0])
                        norm_box = [
                            round(ly0 / ph * 1000),
                            round(lx0 / pw * 1000),
                            round(ly1 / ph * 1000),
                            round(lx1 / pw * 1000),
                        ]

                        in_table = is_inside_any_table([lx0, ly0, lx1, ly1], tabs_obj)

                        is_cand, level_hint, weight = classify_typography_signpost(
                            text=line_text,
                            font_size=max_font_size,
                            is_bold=is_bold,
                            base_font_size=base_font_size,
                            norm_bbox=norm_box,
                            is_in_table=in_table,
                        )

                        if is_cand:
                            candidate_blocks.append({
                                "text": line_text,
                                "size": round(max_font_size, 1),
                                "is_bold": is_bold,
                                "norm_bbox": norm_box,
                                "bbox_pt": [round(lx0, 1), round(ly0, 1), round(lx1, 1), round(ly1, 1)],
                                "level_hint": level_hint,
                                "weight": weight,
                            })
        except Exception as e:
            logger.warning("Typography extraction error: %s", e)

        # 중복 제거 및 인지적 독해 순서(상단 Y -> 좌측 X)로 정렬 (최대 35개)
        selected_typography: List[Dict[str, Any]] = []
        seen_keys = set()
        for cb in candidate_blocks:
            key = (cb["text"], cb["norm_bbox"][0] // 15)
            if key not in seen_keys:
                seen_keys.add(key)
                selected_typography.append(cb)

        selected_typography.sort(key=lambda x: (x["norm_bbox"][0], x["norm_bbox"][1]))
        selected_typography = selected_typography[:35]

        if selected_typography:
            page_summary_lines.append(f"[3. 주요 타이포그래피 블록 (기준 본문폰트: {base_font_size}pt)]")
            for idx, b in enumerate(selected_typography, 1):
                bold_tag = "Bold " if b["is_bold"] else ""
                prompt_repr = f"- ({b['level_hint']}, 폰트:{bold_tag}{b['size']}pt, 위치:{b['norm_bbox']}) {b['text']}"
                b["prompt_repr"] = prompt_repr
                b["block_id"] = idx
                page_summary_lines.append(prompt_repr)
            page_summary_lines.append("")

        # 4. 페이지 원문 텍스트 전문
        raw_page_text = page.get_text("text").strip()
        if raw_page_text:
            page_summary_lines.append("[4. 페이지 원문 텍스트 전문 (Raw Text Flow)]")
            page_summary_lines.append(raw_page_text)
            page_summary_lines.append("")

        page_context_text = "\n".join(page_summary_lines)
        full_context_lines.append(page_context_text)

        pages.append({
            "page_number": p_num,
            "width_pt": pw,
            "height_pt": ph,
            "tables": tables_meta,
            "images": images_meta,
            "typography": selected_typography,
            "raw_text": raw_page_text,
            "page_context_text": page_context_text,
        })

    doc.close()

    full_context_md = "\n\n".join(full_context_lines)

    # 시스템 지침 로드
    instructions = ""
    if SYSTEM_INSTRUCTIONS_PATH.exists():
        instructions = SYSTEM_INSTRUCTIONS_PATH.read_text(encoding="utf-8")

    # 최종 프롬프트 합성
    full_prompt = (
        f"{instructions}\n\n"
        f"======================================================================\n"
        f"[분석 대상 문서 정보]\n"
        f"- 대상 파일: {pdf_path.name}\n"
        f"- 총 페이지: {total_pages}페이지\n"
        f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
        f"{full_context_md}\n"
        f"======================================================================\n\n"
        f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 "
        f"계층적 목차(Outline Tree, L1~L4)와 각 구획별 컴포넌트 분류(classify: header, key_value, table, list, paragraph, media) "
        f"및 실측 기입값(elements)을 1-Stage로 빠짐없이 전수 추출하십시오.\n"
        f"특히 한국형 서식 표(Table)는 내부의 헤더 및 세부 필드명(대학, 학과(부), 학년, 학번 등)까지 L4 단계까지 전수 분해하여 "
        f"목차 트리로 구성하고, 각 필드 노드의 elements에 실제 기입된 값을 매핑하십시오."
    )

    schema_json = {}
    if SCHEMA_PATH.exists():
        try:
            schema_json = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    return {
        "filename": pdf_path.name,
        "total_pages": total_pages,
        "pages": pages,
        "full_context_md": full_context_md,
        "full_prompt": full_prompt,
        "instructions": instructions,
        "schema": schema_json,
    }


@app.get("/api/document/{doc_id}/data")
async def get_document_data(doc_id: str):
    """지정된 문서의 모든 파싱 데이터 및 탭별 투입 데이터 반환."""
    pdf_path = RAW_DATASET_DIR / f"{doc_id}.pdf"
    if not pdf_path.exists():
        # 혹시 확장자가 포함된 경우
        pdf_path = RAW_DATASET_DIR / doc_id
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail=f"PDF file not found: {doc_id}")

    cache_key = str(pdf_path.resolve())
    if cache_key in _DOCUMENT_CACHE:
        return _DOCUMENT_CACHE[cache_key]

    try:
        data = _extract_pdf_process_data(pdf_path)
        _DOCUMENT_CACHE[cache_key] = data
        return data
    except Exception as e:
        logger.error("Failed to parse PDF %s: %s", pdf_path, e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/document/{doc_id}/page-image/{page_num}")
async def get_page_image(doc_id: str, page_num: int):
    """지정된 페이지를 고화질 PNG 이미지로 렌더링하여 반환."""
    pdf_path = RAW_DATASET_DIR / f"{doc_id}.pdf"
    if not pdf_path.exists():
        pdf_path = RAW_DATASET_DIR / doc_id
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail=f"PDF not found: {doc_id}")

    doc = fitz.open(pdf_path)
    if page_num < 1 or page_num > len(doc):
        doc.close()
        raise HTTPException(status_code=400, detail=f"Page number out of range (1..{len(doc)})")

    page = doc[page_num - 1]
    # DPI 144 (2배 스케일 렌더링으로 텍스트 및 그리드 선명화)
    pix = page.get_pixmap(dpi=144, alpha=False)
    png_bytes = pix.tobytes("png")
    doc.close()

    return Response(content=png_bytes, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    print("=" * 68)
    print("  [*] VibePatchNote — Outline V2 Input Data Formation Visualizer")
    print("  [*] URL: http://localhost:8089")
    print("=" * 68)
    uvicorn.run(app, host="127.0.0.1", port=8089, log_level="info")
