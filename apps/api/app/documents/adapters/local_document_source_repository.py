"""로컬 파일 시스템 기반 원본 문서 저장소 어댑터."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import unquote


class LocalDocumentSourceRepository:
    """업로드 디렉터리와 레거시 읽기 폴백을 캡슐화한다."""

    def __init__(self, upload_dir: Path, legacy_source_dir: Path) -> None:
        self._upload_dir = upload_dir
        self._legacy_source_dir = legacy_source_dir

    @staticmethod
    def _safe_filename(filename: str) -> str:
        candidate = Path(filename).name
        if not candidate or candidate in {".", ".."}:
            raise ValueError("Invalid file name")
        return candidate

    def save(self, filename: str, content: bytes) -> Path:
        safe_name = self._safe_filename(filename)
        self._upload_dir.mkdir(parents=True, exist_ok=True)
        target = self._upload_dir / safe_name
        target.write_bytes(content)
        return target

    def resolve(self, filename: str) -> Path:
        safe_name = self._safe_filename(unquote(filename))
        candidate = self._find(self._upload_dir, safe_name)
        if candidate:
            return candidate

        candidate = self._find(self._legacy_source_dir, safe_name)
        if candidate:
            return candidate

        raise FileNotFoundError(f"File not found: {filename}")

    @staticmethod
    def _find(directory: Path, filename: str) -> Path | None:
        if not directory.exists():
            return None

        candidate = (directory / filename).resolve()
        try:
            candidate.relative_to(directory.resolve())
        except ValueError:
            return None

        if candidate.is_file():
            return candidate
        if not candidate.suffix:
            pdf_candidate = candidate.with_suffix(".pdf")
            if pdf_candidate.is_file():
                return pdf_candidate
        return None
