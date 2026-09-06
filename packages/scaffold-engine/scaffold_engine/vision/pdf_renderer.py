"""PDF Vision & Layout Renderer.

PyMuPDF(fitz)를 사용하여 PDF 페이지를 고해상도 이미지로 렌더링하고
2차원 텍스트 블록 및 위치 정보를 추출합니다.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
try:
    import pymupdf as fitz
except ImportError:
    import fitz


@dataclass
class TableGeometry:
    bbox: List[float]  # [x0, y0, x1, y1]
    norm_bbox: List[int]  # [ymin, xmin, ymax, xmax] (0~1000)
    col_count: int
    row_count: int
    col_widths_pct: List[float]  # 각 열의 백분율 너비 (%)
    row_heights_pct: List[float]  # 각 행의 백분율 높이 (%)
    prominent_rows: List[Dict[str, Any]] = field(default_factory=list)  # 높이 20% 이상의 주요 행


@dataclass
class ImageGeometry:
    norm_bbox: List[int]  # [ymin, xmin, ymax, xmax] (0~1000)
    width: int
    height: int


@dataclass
class PageLayoutInfo:
    page_number: int
    image_path: Path
    width: float
    height: float
    text_blocks: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[TableGeometry] = field(default_factory=list)
    images: List[ImageGeometry] = field(default_factory=list)
    raw_text: str = ""


class PdfVisionRenderer:
    """PDF를 페이지별 고해상도 이미지 및 정밀 기하 메타(텍스트/표/이미지)로 변환하는 렌더러."""

    def __init__(self, dpi: int = 150) -> None:
        self.dpi = dpi
        self.zoom = dpi / 72.0  # 기본 72 DPI 기준 배율

    def render_pages(self, pdf_path: Path, output_dir: Optional[Path] = None) -> List[PageLayoutInfo]:
        """PDF의 각 페이지를 PNG 이미지로 렌더링하고 레이아웃 정보를 추출합니다."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        if output_dir is None:
            import tempfile
            output_dir = Path(tempfile.gettempdir()) / "scaffold_vision_cache" / pdf_path.stem
        output_dir.mkdir(parents=True, exist_ok=True)

        results: List[PageLayoutInfo] = []
        doc = fitz.open(pdf_path)

        mat = fitz.Matrix(self.zoom, self.zoom)

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            pw, ph = page.rect.width, page.rect.height

            # 1. 페이지를 이미지로 렌더링
            pix = page.get_pixmap(matrix=mat, alpha=False)
            image_path = output_dir / f"page_{page_num}.png"
            pix.save(str(image_path))

            # 2. 텍스트 블록 및 2D 바운딩 박스 추출
            raw_text = page.get_text("text")
            blocks_raw = page.get_text("blocks")
            text_blocks = []

            for b in blocks_raw:
                # b = (x0, y0, x1, y1, text, block_no, block_type)
                if len(b) >= 5 and b[4].strip():
                    norm_box = [
                        round(b[1] / ph * 1000),
                        round(b[0] / pw * 1000),
                        round(b[3] / ph * 1000),
                        round(b[2] / pw * 1000),
                    ]
                    text_blocks.append({
                        "bbox": [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
                        "norm_bbox": norm_box,
                        "text": b[4].strip(),
                    })

            # 3. 이미지 / 로고 기하 추출
            images: List[ImageGeometry] = []
            try:
                for img_info in page.get_image_info(xrefs=True):
                    b = img_info.get("bbox")
                    if b:
                        norm_box = [
                            round(b[1] / ph * 1000),
                            round(b[0] / pw * 1000),
                            round(b[3] / ph * 1000),
                            round(b[2] / pw * 1000),
                        ]
                        images.append(
                            ImageGeometry(
                                norm_bbox=norm_box,
                                width=img_info.get("width", 0),
                                height=img_info.get("height", 0),
                            )
                        )
            except Exception:
                pass

            # 4. 표 (Table) 정밀 기하 및 비율 추출
            tables: List[TableGeometry] = []
            try:
                tabs = page.find_tables()
                for tab in tabs:
                    t_x0, t_y0, t_x1, t_y1 = tab.bbox
                    t_w = max(t_x1 - t_x0, 1.0)
                    t_h = max(t_y1 - t_y0, 1.0)

                    # 1행 셀들로부터 열 너비 비율 산출
                    first_row_cells = [c for c in tab.cells if abs(c[1] - t_y0) < 3]
                    first_row_cells.sort(key=lambda c: c[0])
                    if first_row_cells:
                        col_widths_pct = [round((c[2] - c[0]) / t_w * 100, 1) for c in first_row_cells]
                    else:
                        col_widths_pct = [round(100.0 / tab.col_count, 1)] * tab.col_count

                    # 1열 셀들로부터 행 높이 비율 산출
                    first_col_cells = [c for c in tab.cells if abs(c[0] - t_x0) < 3]
                    first_col_cells.sort(key=lambda c: c[1])
                    if first_col_cells:
                        row_heights_pct = [round((c[3] - c[1]) / t_h * 100, 1) for c in first_col_cells]
                    else:
                        row_heights_pct = [round(100.0 / tab.row_count, 1)] * tab.row_count

                    # 높이 15% 이상을 차지하는 주요 행 식별 (회의내용, 증빙자료 첨부란 등)
                    prominent_rows = []
                    for r_idx, r_pct in enumerate(row_heights_pct):
                        if r_pct >= 15.0:
                            # 해당 행의 텍스트 확인
                            row_cells = [c for c in tab.cells if r_idx < len(first_col_cells) and abs(c[1] - first_col_cells[r_idx][1]) < 3]
                            cell_text = ""
                            for c in row_cells:
                                c_rect = fitz.Rect(c[0], c[1], c[2], c[3])
                                cell_text += page.get_text("text", clip=c_rect).strip() + " "
                            prominent_rows.append({
                                "row_index": r_idx,
                                "height_pct": r_pct,
                                "estimated_min_height_px": int(r_pct * 6.0),  # A4 기준 px 추정
                                "content_hint": cell_text.strip()[:40],
                            })

                    norm_t_box = [
                        round(t_y0 / ph * 1000),
                        round(t_x0 / pw * 1000),
                        round(t_y1 / ph * 1000),
                        round(t_x1 / pw * 1000),
                    ]

                    tables.append(
                        TableGeometry(
                            bbox=[round(t_x0, 1), round(t_y0, 1), round(t_x1, 1), round(t_y1, 1)],
                            norm_bbox=norm_t_box,
                            col_count=tab.col_count,
                            row_count=tab.row_count,
                            col_widths_pct=col_widths_pct,
                            row_heights_pct=row_heights_pct,
                            prominent_rows=prominent_rows,
                        )
                    )
            except Exception:
                pass

            results.append(
                PageLayoutInfo(
                    page_number=page_num,
                    image_path=image_path,
                    width=pw,
                    height=ph,
                    text_blocks=text_blocks,
                    tables=tables,
                    images=images,
                    raw_text=raw_text,
                )
            )

        doc.close()
        return results


def render_page_as_png(
    pdf_path: Union[str, Path],
    page_number: int = 1,
    dpi: int = 150,
) -> bytes:
    """PDF 지정 페이지를 순수 PNG 바이너리로 렌더링합니다."""
    doc = fitz.open(str(pdf_path))
    try:
        idx = min(max(page_number, 1), len(doc)) - 1
        page = doc[idx]
        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
    finally:
        doc.close()


def _extract_slot_meta(slot: Any, default_number: int) -> Optional[tuple[List[int], int, int]]:
    """슬롯 객체(Pydantic or dict)에서 (box_2d, number, page_number) 안전 추출."""
    if hasattr(slot, "box_2d"):
        box = slot.box_2d
        num = getattr(slot, "number", default_number)
        page = getattr(slot, "page_number", 1)
    elif isinstance(slot, dict):
        box = slot.get("box_2d", [])
        num = slot.get("number", default_number)
        page = slot.get("pageNumber", slot.get("page_number", 1))
    else:
        return None

    if len(box) != 4:
        return None
    return box, num, page


def _draw_slot_box_and_badge(page: Any, rect: fitz.Rect, num: int) -> None:
    """PDF 페이지 위에 슬롯 하이라이트 박스와 번호 배지를 렌더링합니다."""
    # 1. 보라색 반투명 박스 (#9333ea)
    page.draw_rect(
        rect,
        color=(0.576, 0.2, 0.918),
        fill=(0.933, 0.867, 0.988),
        width=1.5,
        fill_opacity=0.35,
    )

    # 2. 좌측 상단 번호 배지
    badge_w = min(26.0, max(14.0, rect.width * 0.4))
    badge_h = min(11.0, max(8.0, rect.height * 0.5))
    badge_y0 = max(0.0, rect.y0 - badge_h) if rect.y0 >= badge_h else rect.y0
    badge_rect = fitz.Rect(rect.x0, badge_y0, rect.x0 + badge_w, badge_y0 + badge_h)

    page.draw_rect(
        badge_rect,
        color=(0.576, 0.2, 0.918),
        fill=(0.576, 0.2, 0.918),
        fill_opacity=0.9,
    )
    page.insert_textbox(
        badge_rect,
        f"s{num}",
        fontsize=6.5,
        color=(1.0, 1.0, 1.0),
        align=1,  # 가운데 정렬
    )


def render_slot_overlay_png(
    pdf_path: Union[str, Path],
    slots: List[Any],
    page_number: int = 1,
    dpi: int = 150,
) -> bytes:
    """
    원본 PDF 페이지 위에 추출된 슬롯들의 위치를 보라색 반투명 박스와 번호 태그로 오버레이 렌더링합니다.
    (0~1000 정규화 좌표 [ymin, xmin, ymax, xmax] -> 이미지 픽셀 좌표 매핑)
    """
    doc = fitz.open(str(pdf_path))
    try:
        idx = min(max(page_number, 1), len(doc)) - 1
        page = doc[idx]
        pw, ph = page.rect.width, page.rect.height

        for i, s in enumerate(slots):
            meta = _extract_slot_meta(s, default_number=i + 1)
            if not meta:
                continue

            box, num, p_num = meta
            if p_num != page_number:
                continue

            ymin, xmin, ymax, xmax = box
            x0, y0 = (xmin / 1000.0) * pw, (ymin / 1000.0) * ph
            x1, y1 = (xmax / 1000.0) * pw, (ymax / 1000.0) * ph

            if x1 <= x0 or y1 <= y0:
                continue

            _draw_slot_box_and_badge(page, fitz.Rect(x0, y0, x1, y1), num)

        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
    finally:
        doc.close()


