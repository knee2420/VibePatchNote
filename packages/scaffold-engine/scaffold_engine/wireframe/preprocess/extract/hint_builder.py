"""[scaffold_engine.wireframe] 기하 힌트 매트릭스 빌더 (HintBuilder).

PyMuPDF로 실측된 PageGeometry(표 격자, 셀 병합, 블록 좌표)를 분석하여,
비전 모델이 시각 이미지와 대조할 수 있는 고정밀 힌트 텍스트(Hint Matrix)를 생성합니다.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.tools.pdf_geometry import Block, PageGeometry, TableGeometry

# 기입값(value/slot) 판정 추천 정규식 패턴
VALUE_INDICATORS = [
    r"010-\d{3,4}-\d{4}",
    r"[\w\.-]+@[\w\.-]+\.\w+",
    r"(?:19|20)\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}",
    r"[\$₩￦]\s*[\d,]+",
    r"[\d,]+\s*(?:원|달러|USD|KRW)",
    r"(?:팀장|팀원|대표|이사|총괄|교수|학생|연구원)",
]
_VALUE_REGEX = re.compile("|".join(VALUE_INDICATORS), re.IGNORECASE)


class HintBuilder:
    """실측 기하로부터 비전 모델용 힌트 매트릭스 문자열을 생성하는 빌더."""

    @classmethod
    def build_hint_text(cls, page: "PageGeometry") -> str:
        """비전 멀티모달 모델에 전달할 정밀 표 격자 및 텍스트 힌트 텍스트 생성."""
        pw, ph = round(page.width, 1), round(page.height, 1)
        orient = "세로" if ph >= pw else "가로"
        lines: List[str] = [
            f"=== [페이지 기본 정보: {pw}pt x {ph}pt ({orient} 문서)] ===",
            f"- 검출된 정밀 표(Table) 개수: {len(page.tables)}개",
            f"- 검출된 외곽 독립 블록: {len([b for b in page.classifiable() if b.kind != 'cell'])}개",
        ]

        # 1. 표(Table) 상세 격자 및 셀 구조
        if page.tables:
            lines.append("\n=== [1. 실측된 정밀 표(Table) 상세 격자 및 셀 구조] ===")
            for t in page.tables:
                pos_hint = "상단" if t.norm[0] < 300 else ("중단" if t.norm[0] < 600 else "하단")
                lines.append(f"\n▶ 표 [{t.id}]: 위치={pos_hint} 영역 (좌표: {t.norm}), 규격={t.rows}행 x {t.cols}열")
                if t.col_pct:
                    lines.append(f"  - 열 너비 비율(%): {[round(c, 1) for c in t.col_pct]}")
                if t.row_h_pt:
                    lines.append(f"  - 행 높이(pt): {[round(h, 1) for h in t.row_h_pt]}")
                lines.append("  [셀 목록]")

                table_cells = [
                    b for b in page.blocks
                    if b.kind == "cell" and (b.id.startswith(f"{t.id}-") or b.id.startswith(f"{t.id.lstrip('t')}-"))
                ]
                for c in table_cells:
                    span_desc = []
                    if getattr(c, "rowspan", 1) > 1:
                        span_desc.append(f"{c.rowspan}행 병합(세로)")
                    if getattr(c, "colspan", 1) > 1:
                        span_desc.append(f"{c.colspan}열 병합(가로)")
                    span_str = f" [{', '.join(span_desc)}]" if span_desc else ""

                    hints = []
                    txt = c.text.strip()
                    if c.col == 0:
                        hints.append("첫 번째 열(주로 항목 라벨)")
                    if _VALUE_REGEX.search(txt):
                        hints.append("인스턴스 기입값/슬롯 후보")
                    hint_suffix = f" <추천: {', '.join(hints)}>" if hints else ""

                    clean_txt = txt.replace("\n", " ").strip()
                    if len(clean_txt) > 200:
                        clean_txt = clean_txt[:200] + " ...(후략)"

                    coord_str = f"r{c.row}c{c.col}" if c.row is not None and c.col is not None else "cell"
                    lines.append(f'  * 셀 [{c.id}] ({coord_str}{span_str}) (폰트:{round(c.size, 1)}pt, 위치:{c.norm}){hint_suffix}: "{clean_txt}"')

        # 2. 표 외곽 독립 텍스트/미디어 블록 상세
        outer_blocks = [b for b in page.classifiable() if b.kind != "cell"]
        if outer_blocks:
            lines.append("\n=== [2. 표 외곽 독립 텍스트/미디어 블록 상세] ===")
            for b in outer_blocks:
                txt = b.text.replace("\n", " ").strip()
                if len(txt) > 200:
                    txt = txt[:200] + " ...(후략)"

                pos_desc = []
                if b.norm[0] < 150:
                    pos_desc.append("문서 최상단 헤더/제목 영역")
                elif b.norm[2] > 900:
                    pos_desc.append("문서 최하단 푸터/페이지번호 영역")

                if _VALUE_REGEX.search(txt):
                    pos_desc.append("인스턴스 기입값/슬롯 후보")
                pos_str = f" <특징: {', '.join(pos_desc)}>" if pos_desc else ""

                lines.append(f'  * 블록 [{b.id}] ({b.kind}, 폰트:{round(b.size, 1)}pt, 위치:{b.norm}){pos_str}: "{txt}"')

        return "\n".join(lines)
