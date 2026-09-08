"""
V2 01.dataset 전체 PDF 인풋 컨텍스트 일괄 재생성 스크립트.
개선된 DocumentContextBuilder를 사용하여 raw PDF -> inputs/*.md 일괄 추출.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

# 윈도우 UTF-8 콘솔 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")

V2_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(V2_DIR))

from prompts.context_builder import DocumentContextBuilder

raw_dir = V2_DIR / "01.dataset" / "raw"
inputs_dir = V2_DIR / "01.dataset" / "inputs"
inputs_dir.mkdir(parents=True, exist_ok=True)

builder = DocumentContextBuilder(max_text_blocks_per_page=30)

pdf_files = sorted(list(raw_dir.glob("*.pdf")))
print(f"=== 총 {len(pdf_files)}개 PDF 문서 전체 인풋 재생성 시작 ===\n")

for pdf in pdf_files:
    res = builder.build_context(pdf, output_dir=inputs_dir)
    # 또한 {stem}.md 로도 저장하여 호환성 유지
    md_path = inputs_dir / f"{pdf.stem}.md"
    md_path.write_text(res["context_text"], encoding="utf-8")

    total_tables = sum(len(p["tables"]) for p in res["pages_meta"])
    total_images = sum(len(p["images"]) for p in res["pages_meta"])
    total_typo = sum(p["text_blocks_count"] for p in res["pages_meta"])
    print(f"[*] {pdf.name}")
    print(f"    - 페이지: {res['total_pages']}p | 표: {total_tables}개 | 미디어: {total_images}개 | 선별 타이포 블록: {total_typo}개")

print("\n=== 전체 재생성 완료 ===")
