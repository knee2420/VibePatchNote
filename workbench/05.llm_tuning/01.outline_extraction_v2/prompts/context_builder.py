"""[01.outline_extraction_v2] PDF 3중 멀티모달 컨텍스트 빌더 (PyMuPDF 기반)."""
from pathlib import Path
from typing import Any, Dict, List, Optional
try:
    import pymupdf as fitz
except ImportError:
    import fitz


class DocumentContextBuilder:
    """PDF 원본으로부터 표 구조 메타, 타이포그래피 블록, 원문 텍스트 전문을 추출하여 결합합니다."""

    def __init__(self, max_text_blocks_per_page: int = 150) -> None:
        self.max_text_blocks_per_page = max_text_blocks_per_page

    def build_context(self, pdf_path: Path) -> Dict[str, Any]:
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
            pw, ph = page.rect.width, page.rect.height

            summary_lines.append(f"==================== [페이지 {p_num} / 총 {total_pages}페이지] ====================")

            # 1. 표(Table) 구조 실측
            tables_meta = []
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

            # 2. 주요 타이포그래피 블록 (폰트 크기 및 위치)
            raw_blocks = page.get_text("dict").get("blocks", [])
            text_blocks = []
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
                summary_lines.append("[2. 주요 타이포그래피 블록 (폰트 크기 및 위치)]")
                for b in text_blocks[:self.max_text_blocks_per_page]:
                    summary_lines.append(f"- (폰트:{b['size']}, 위치:{b['norm_bbox']}) {b['text']}")
                summary_lines.append("")

            # 3. 페이지 원문 텍스트 전문 (연속 텍스트 흐름)
            raw_page_text = page.get_text("text").strip()
            if raw_page_text:
                summary_lines.append("[3. 페이지 원문 텍스트 전문 (Raw Text Flow)]")
                summary_lines.append(raw_page_text)
                summary_lines.append("")

            pages_data.append({
                "page_number": p_num,
                "tables": tables_meta,
                "text_blocks_count": len(text_blocks),
                "raw_text_len": len(raw_page_text),
            })

        doc.close()

        return {
            "filename": pdf_path.name,
            "resolved_path": str(pdf_path),
            "total_pages": total_pages,
            "context_text": "\n".join(summary_lines),
            "pages_meta": pages_data,
        }
