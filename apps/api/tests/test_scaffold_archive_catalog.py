from __future__ import annotations

from pathlib import Path

from app.scaffolds.adapters.local_scaffold_repository import LocalScaffoldRepository
from app.scaffolds.schemas import ScaffoldArchiveRecord


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
