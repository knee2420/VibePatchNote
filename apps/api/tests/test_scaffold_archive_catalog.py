from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from scaffold_engine.wireframe.schemas import ScaffoldMeta

from app.wireframe.adapters import (
    LocalWireframeRepository as LocalScaffoldRepository,
)
from app.wireframe.schemas import (
    WireframeArchiveRecord as ScaffoldArchiveRecord,
)
from app.wireframe.service import WireframeArchiveService


def _record(scaffold_id: str, title: str, created_at: str) -> ScaffoldArchiveRecord:
    return ScaffoldArchiveRecord(
        scaffold_id=scaffold_id,
        doc_id="doc-demo",
        title=title,
        source_pdf_file_name="회의록.pdf",
        created_at=created_at,
    )


def test_scaffold_archive_uses_readable_folder_and_catalog(tmp_path: Path) -> None:
    repository = LocalScaffoldRepository(tmp_path)
    record = _record("scaffold-abc", "회의비 사용 내역", "2026-09-11T10:05:31+00:00")

    archive = repository.save_artifacts(record, "<p />", "# 내용", [], "# 명세")

    assert archive.name == "20260911-100531__회의비 사용 내역__scaffold-abc"
    assert repository.resolve_dir(record.scaffold_id) == archive.resolve()
    catalog = (tmp_path / "README.md").read_text(encoding="utf-8")
    assert "문서별 최신 작업본" in catalog
    assert archive.name in catalog


def test_scaffold_archive_keeps_legacy_id_folder_readable(tmp_path: Path) -> None:
    repository = LocalScaffoldRepository(tmp_path)
    record = _record("scaffold-legacy", "이전 결과", "2026-09-10T10:00:00+00:00")
    legacy = tmp_path / record.scaffold_id
    legacy.mkdir()
    repository._write_manifest(legacy, record)

    assert repository.resolve_dir(record.scaffold_id) == legacy.resolve()


def test_wireframe_archive_service_handles_both_arguments(tmp_path: Path) -> None:
    repository = LocalScaffoldRepository(tmp_path)
    service = WireframeArchiveService(repository)

    dummy_pdf = tmp_path / "test_doc.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4 dummy")

    mock_result = MagicMock()
    mock_result.meta = ScaffoldMeta(
        id="scaffold-meta-1",
        title="테스트 서식",
        target_doc="test_doc.pdf",
        source_pdf_file_name="test_doc.pdf",
        difficulty="medium",
        description="설명",
    )
    mock_result.html_content = "<p>HTML</p>"
    mock_result.markdown_content = "# MD"
    mock_result.slots = []

    # 1) pdf_path 로 호출
    meta1 = service.archive_scaffold(doc_id="doc-1", pdf_path=dummy_pdf, result=mock_result)
    assert meta1.scaffold_id is not None
    assert meta1.title == "테스트 서식"

    # 2) source_path 로 호출 (하위 호환 및 방어)
    meta2 = service.archive_scaffold(doc_id="doc-1", source_path=dummy_pdf, result=mock_result)
    assert meta2.scaffold_id is not None
    assert meta2.title == "테스트 서식"

