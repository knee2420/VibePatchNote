"""[scaffold_engine.outline.prompts] PDF 3중 멀티모달 컨텍스트 빌더 (PyMuPDF 기반)."""
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import pymupdf as fitz
except ImportError:
    import fitz


class DocumentContextBuilder:
    """PDF 원본으로부터 표 구조 메타, 타이포그래피 블록, 원문 텍스트 전문을 추출하고 파일로 영속화합니다."""

    def __init__(self, max_text_blocks_per_page: Optional[int] = None) -> None:
        self.max_text_blocks_per_page = max_text_blocks_per_page

    def build_context(
        self,
        pdf_path: Path,
        output_dir: Optional[Path] = None,
        display_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        target_filename = display_name or pdf_path.name
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        pages_data: List[Dict[str, Any]] = []
        summary_lines: List[str] = []

        for page_idx in range(total_pages):
            page = doc[page_idx]
            p_num = page_idx + 1
            pw, ph = page.rect.width, page.rect.height

            summary_lines.append(f"==================== [페이지 {p_num} / 총 {total_pages}페이지] ====================")

            # 1. 표(Table) 구조 실측
            tables_meta: List[Dict[str, Any]] = []
            try:
                tabs = page.find_tables()
                if tabs and len(tabs.tables) > 0:
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

            # 3. 실측 텍스트 블록 기하 메타데이터 (정규화 좌표 [ymin, xmin, ymax, xmax] 0~1000 전수 추출)
            raw_blocks = page.get_text("dict").get("blocks", [])
            text_blocks: List[Dict[str, Any]] = []
            for b in raw_blocks:
                if b.get("type") == 0:
                    b_text = ""
                    b_size = 10.0
                    for line in b.get("lines", []):
                        for s in line.get("spans", []):
                            b_text += s.get("text", "") + " "
                            b_size = max(b_size, s.get("size", 10.0))
                    b_text = b_text.strip()
                    if b_text:
                        bx0, by0, bx1, by1 = b.get("bbox", [0, 0, 0, 0])
                        norm_box = [round(by0 / ph * 1000), round(bx0 / pw * 1000), round(by1 / ph * 1000), round(bx1 / pw * 1000)]
                        text_blocks.append({
                            "text": b_text,
                            "size": round(b_size, 1),
                            "norm_bbox": norm_box,
                        })

            if text_blocks:
                # 위에서 아래(Ymin), 왼쪽에서 오른쪽(Xmin) 읽기 순서대로 정렬
                text_blocks.sort(key=lambda x: (x["norm_bbox"][0], x["norm_bbox"][1]))
                selected_blocks = text_blocks
                if self.max_text_blocks_per_page is not None and self.max_text_blocks_per_page > 0:
                    if len(text_blocks) > self.max_text_blocks_per_page:
                        selected_blocks = text_blocks[: self.max_text_blocks_per_page]

                summary_lines.append("[3. 실측 텍스트 블록 기하 메타데이터 (정규화 좌표 [ymin, xmin, ymax, xmax] 0~1000)]")
                for idx, b in enumerate(selected_blocks, 1):
                    summary_lines.append(f"- [블록 {idx}] 상대좌표={b['norm_bbox']}, 폰트크기={b['size']}pt: {b['text']}")
                summary_lines.append("")

            # 4. 페이지 원문 텍스트 전문 (연속 텍스트 흐름 — 100% 무손실 원문 전문)
            raw_page_text = page.get_text("text").strip()
            if raw_page_text:
                summary_lines.append("[4. 페이지 원문 텍스트 전문 (Raw Text Flow)]")
                summary_lines.append(raw_page_text)
                summary_lines.append("")

            pages_data.append({
                "page_number": p_num,
                "tables": tables_meta,
                "images": images_meta,
                "text_blocks_count": len(text_blocks),
                "raw_text_len": len(raw_page_text),
            })

        doc.close()

        context_md_text = "\n".join(summary_lines)

        # 사용자 요청: 컨텍스트 마크다운(.context.md) 파일을 디스크에 영속화
        context_file_path = None
        if output_dir:
            output_dir = Path(output_dir).resolve()
            output_dir.mkdir(parents=True, exist_ok=True)
            context_file_path = output_dir / f"{pdf_path.stem}.context.md"
            context_file_path.write_text(context_md_text, encoding="utf-8")

        return {
            "filename": target_filename,
            "resolved_path": str(pdf_path),
            "total_pages": total_pages,
            "context_text": context_md_text,
            "context_file_path": str(context_file_path) if context_file_path else None,
            "pages_meta": pages_data,
        }
