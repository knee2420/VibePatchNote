"""[01.outline_extraction_v2] PDF 멀티모달 컨텍스트 빌더 (보편적 타이포그래피 & 공간 레이아웃 분석기).

특정 도메인/키워드 하드코딩(오버피팅)을 배제하고,
조판학(Typography) 및 문서 구조 분석의 표준적 통계 원칙을 적용합니다:
1. 본문 기준 폰트 크기(Base Body Font Size)의 통계적 자동 산출 (글자수 가중치 최빈값)
2. 상대적 폰트 스케일 (size / base_size) 기반의 시각적 위계(Visual Hierarchy) 판별
3. 볼드(Bold) 스타일 플래그 및 단일 행/짧은 구(Standalone Phrase) 기하 판별
4. 실측된 표(Table) 구획과의 공간적 포함 관계(Outer Heading vs Inner Table Label) 연동
5. 보편적 조판 기호(번호 매김, 대괄호 태그, 불릿) 감지
"""
from __future__ import annotations

from collections import Counter
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    import fitz


# 범용 조판/목록 기호 (번호형, 괄호/대괄호 태그, 표준 불릿)
RE_UNIVERSAL_PREFIX = re.compile(
    r"^(?:\d+[\.\)]\s*|[A-Za-z][\.\)]\s*|[\[\(][^\]\)]+[\]\)]\s*|[•\-\*○▪▶■]\s*)"
)

# 페이지 번호 단독 표기
RE_PAGE_NUMBER = re.compile(r"^[-–—]?\s*\d+\s*(?:/\s*\d+)?\s*[-–—]?$")

# 단순 값(Value) 배제 패턴: 날짜, 통화/수치/단위 등
RE_DATE_PATTERN = re.compile(r"^\d{4}[\.\-/]\d{1,2}[\.\-/]\d{1,2}")
RE_NUMERIC_VALUE = re.compile(
    r"^[\$₩\€\£]?\s*[\d,]+(?:\.\d+)?\s*(?:원|usd|krw|명|호|개|장|부|%|pt)?$", re.IGNORECASE
)


def compute_page_font_baseline(page: fitz.Page) -> float:
    """페이지 내 텍스트의 글자 수(Char count) 가중치를 집계하여 본문 기본 폰트 크기를 통계적으로 산출."""
    font_char_counts: Counter[float] = Counter()
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") == 0:
            for line in b.get("lines", []):
                for s in line.get("spans", []):
                    t = s.get("text", "").strip()
                    if t:
                        size = round(s.get("size", 10.0), 1)
                        font_char_counts[size] += len(t)

    if not font_char_counts:
        return 10.0

    # 각주/면책조항(Fine Print < 8.0pt)을 제외한 가독 텍스트 중 글자 수 최빈값
    body_candidates = {k: v for k, v in font_char_counts.items() if k >= 8.0}
    if body_candidates:
        return max(body_candidates.items(), key=lambda x: x[1])[0]
    return font_char_counts.most_common(1)[0][0]


def is_inside_any_table(bbox: List[float], tables: List[Any]) -> bool:
    """주어진 텍스트 바운딩 박스가 실측된 표(Table) 영역 내부에 위치하는지 판정."""
    x0, y0, x1, y1 = bbox
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    for tab in tables:
        tx0, ty0, tx1, ty1 = tab.bbox
        if tx0 <= cx <= tx1 and ty0 <= cy <= ty1:
            return True
    return False


def classify_typography_signpost(
    text: str,
    font_size: float,
    is_bold: bool,
    base_font_size: float,
    norm_bbox: List[int],
    is_in_table: bool,
) -> Tuple[bool, str, int]:
    """보편적 통계 및 레이아웃 기하 속성을 기반으로 아웃라인/라벨 여부와 위계를 판별.

    Returns:
        (선별여부, 위계힌트, 우선순위가중치)
    """
    cleaned = text.strip()
    char_len = len(cleaned)

    # 1. 극단적 길이 및 노이즈 제외
    if char_len < 2 or char_len > 65:
        return False, "ignored", 0

    if RE_PAGE_NUMBER.match(cleaned):
        return False, "ignored", 0

    # 2. 단순 기입값(Value) 배제: 날짜, 단순 금액/수량 등
    if RE_DATE_PATTERN.match(cleaned) or RE_NUMERIC_VALUE.match(cleaned):
        return False, "ignored", 0

    # 3. 본문 문단(Paragraph) 필터: 35자 이상이면서 문장부호가 포함된 연속 서술문 배제
    if char_len > 35 and (cleaned.count(",") >= 2 or cleaned.endswith((".", "!", "?"))):
        return False, "ignored", 0

    ratio = font_size / max(base_font_size, 1.0)
    ymin = norm_bbox[0]

    # 4. 대표제/대제목 (H1 / Title): 본문 대비 1.3배 이상 크거나, 상단 25% 이내의 1.15배 이상 폰트
    if ratio >= 1.30 or (ymin < 250 and ratio >= 1.15 and char_len <= 40):
        return True, "H1 (Title)", 100

    # 5. 섹션 헤더 (H2 / Section):
    # - 보편적 번호/불릿/태그 접두사를 가진 45자 이하의 독립 행
    # - 또는 본문 대비 1.15배 이상의 폰트 크기
    has_prefix = bool(RE_UNIVERSAL_PREFIX.match(cleaned))
    if has_prefix and char_len <= 45:
        return True, "H2 (Section)", 85

    if ratio >= 1.15 and char_len <= 35:
        return True, "H2 (Section)", 80

    # 6. 표(Table) 내부 라벨 (Table Label):
    # 표 내부에 위치하면서 짧은 구(25자 이하)이며, 볼드체이거나 콜론(:) 포함 라벨 또는 단문(8자 이하)
    if is_in_table:
        if char_len <= 25 and (is_bold or ":" in cleaned or char_len <= 8):
            return True, "Table Label", 70

    # 7. 표 외부의 독립 라벨/소제목 (H3 / Standalone Label):
    # 본문 크기라도 볼드체이거나, 콜론(:)으로 명시된 25자 이하의 독립 행
    if is_bold and char_len <= 30:
        return True, "H3 (Label)", 65

    if ":" in cleaned and char_len <= 30:
        return True, "H3 (Label)", 60

    return False, "ignored", 0


class DocumentContextBuilder:
    """PDF 원본으로부터 표 기하 메타, 시각 미디어 메타, 통계 기반 타이포그래피 블록, 원문 전문을 추출."""

    def __init__(self, max_text_blocks_per_page: int = 35) -> None:
        self.max_text_blocks_per_page = max_text_blocks_per_page

    def build_context(self, pdf_path: Path, output_dir: Optional[Path] = None) -> Dict[str, Any]:
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        pages_data = []
        summary_lines = []

        for page_idx in range(total_pages):
            page = doc[page_idx]
            p_num = page_idx + 1
            pw, ph = float(page.rect.width), float(page.rect.height)

            # 해당 페이지의 본문 폰트 크기 기준선(통계치) 계산
            base_font_size = compute_page_font_baseline(page)

            summary_lines.append(f"==================== [페이지 {p_num} / 총 {total_pages}페이지] ====================")

            # 1. 표(Table) 구조 실측
            tables_meta = []
            tabs_obj = []
            try:
                tabs = page.find_tables()
                if tabs and len(tabs.tables) > 0:
                    tabs_obj = tabs.tables
                    summary_lines.append("[1. 실측된 표(Table) 구조 메타]")
                    for t_idx, tab in enumerate(tabs, 1):
                        x0, y0, x1, y1 = tab.bbox
                        norm_box = [round(y0 / ph * 1000), round(x0 / pw * 1000), round(y1 / ph * 1000), round(x1 / pw * 1000)]
                        tables_meta.append({
                            "table_id": t_idx,
                            "norm_bbox": norm_box,
                            "cols": tab.col_count,
                            "rows": tab.row_count,
                        })
                        summary_lines.append(f"- 표 {t_idx}: 상대좌표={norm_box}, 규격={tab.col_count}열 x {tab.row_count}행")
                    summary_lines.append("")
            except Exception:
                pass

            # 2. 이미지 / 로고 / 시각 미디어(Media) 구조 실측
            images_meta = []
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
                        images_meta.append({
                            "image_id": img_idx,
                            "norm_bbox": norm_box,
                            "width": w,
                            "height": h,
                        })
                if images_meta:
                    summary_lines.append("[2. 실측된 이미지/로고/시각 미디어(Media) 기하 메타]")
                    for img in images_meta:
                        pos_desc = "상단 헤더 영역" if img["norm_bbox"][0] < 250 else "본문/하단 영역"
                        summary_lines.append(f"- 미디어(Media) {img['image_id']}: 상대좌표={img['norm_bbox']}, 크기={img['width']}x{img['height']}px ({pos_desc})")
                    summary_lines.append("")
            except Exception:
                pass

            # 3. 보편적 타이포그래피 블록 선별 (폰트 통계 + 볼드 + 기하 배치)
            candidate_blocks = []
            try:
                raw_blocks = page.get_text("dict").get("blocks", [])
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
            except Exception:
                pass

            # 중복 제거 및 인지적 독해 순서 (상단 Y -> 좌측 X) 정렬
            selected_blocks = []
            seen_keys = set()
            for cb in candidate_blocks:
                key = (cb["text"], cb["norm_bbox"][0] // 15)
                if key not in seen_keys:
                    seen_keys.add(key)
                    selected_blocks.append(cb)

            selected_blocks.sort(key=lambda x: (x["norm_bbox"][0], x["norm_bbox"][1]))
            selected_blocks = selected_blocks[: self.max_text_blocks_per_page]

            if selected_blocks:
                summary_lines.append(f"[3. 주요 타이포그래피 블록 (기준 본문폰트: {base_font_size}pt)]")
                for b in selected_blocks:
                    bold_tag = "Bold " if b["is_bold"] else ""
                    summary_lines.append(f"- ({b['level_hint']}, 폰트:{bold_tag}{b['size']}pt, 위치:{b['norm_bbox']}) {b['text']}")
                summary_lines.append("")

            # 4. 페이지 원문 텍스트 전문 (무손실 텍스트 흐름)
            raw_page_text = page.get_text("text").strip()
            if raw_page_text:
                summary_lines.append("[4. 페이지 원문 텍스트 전문 (Raw Text Flow)]")
                summary_lines.append(raw_page_text)
                summary_lines.append("")

            pages_data.append({
                "page_number": p_num,
                "base_font_size": base_font_size,
                "tables": tables_meta,
                "images": images_meta,
                "text_blocks_count": len(selected_blocks),
                "raw_text_len": len(raw_page_text),
            })

        doc.close()

        context_md_text = "\n".join(summary_lines)

        if output_dir:
            output_dir = Path(output_dir).resolve()
            output_dir.mkdir(parents=True, exist_ok=True)
            context_file_path = output_dir / f"{pdf_path.stem}.context.md"
            context_file_path.write_text(context_md_text, encoding="utf-8")
        else:
            context_file_path = None

        return {
            "filename": pdf_path.name,
            "resolved_path": str(pdf_path),
            "total_pages": total_pages,
            "context_text": context_md_text,
            "context_file_path": str(context_file_path) if context_file_path else None,
            "pages_meta": pages_data,
        }
