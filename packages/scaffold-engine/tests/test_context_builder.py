import fitz
from pathlib import Path
from scaffold_engine.outline.prompts.context_builder import DocumentContextBuilder


def test_context_builder_extracts_all_text_blocks_and_geometry(tmp_path: Path):
    pdf_path = tmp_path / "test_doc.pdf"
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    
    # 상단 헤더 (Y: 50)
    page.insert_text((50, 50), "Document Title Header", fontsize=18)
    # 본문 중간 (Y: 300)
    page.insert_text((50, 300), "Middle Section Body Content", fontsize=11)
    # 하단 푸터 (Y: 750)
    page.insert_text((50, 750), "Footer Contact Support 2026", fontsize=9)
    doc.save(str(pdf_path))
    doc.close()

    builder = DocumentContextBuilder()
    ctx = builder.build_context(pdf_path)

    assert ctx["total_pages"] == 1
    assert "Document Title Header" in ctx["context_text"]
    assert "Middle Section Body Content" in ctx["context_text"]
    assert "Footer Contact Support 2026" in ctx["context_text"]
    
    # 3개 블록이 모두 실측 텍스트 블록 섹션에 포함되어 있어야 함
    assert "[3. 실측 텍스트 블록 기하 메타데이터" in ctx["context_text"]
    assert "상대좌표=" in ctx["context_text"]
    assert ctx["pages_meta"][0]["text_blocks_count"] == 3
