"""결정적 파생 캐시 어댑터.

    cache/documents/{doc_id}/
      ├── vision/   page_N.png · geometry.json   PyMuPDF 렌더 — 같은 PDF 면 같은 결과
      └── context/  {stem}.context.md            엔진 컨텍스트 추출 — LLM 미개입

여기에 들어오는 것은 **LLM 이 개입하지 않은 파생물뿐**이다. 통째로 지워도 다음
요청에서 같은 값이 다시 만들어진다. 그 성질이 성립하지 않으면 아티팩트이지 캐시가
아니므로 `data/` 로 가야 한다.
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from app.core.storage import read_json, safe_segment, write_json

VISION_DIR = "vision"
CONTEXT_DIR = "context"
GEOMETRY_FILE = "geometry.json"


class LocalDocumentCacheRepository:
    """문서별 결정적 파생의 보관 위치를 소유한다."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    def _package(self, doc_id: str) -> Path:
        return self._root / safe_segment(doc_id)

    def context_dir(self, doc_id: str) -> Path:
        """엔진에 주입할 컨텍스트 출력 위치.

        엔진이 스스로 위치를 정하면 업로드 디렉터리를 오염시킨다. 위치를 정하는 것은
        호스트의 일이고, 이 값이 그 답이다.
        """
        target = self._package(doc_id) / CONTEXT_DIR
        target.mkdir(parents=True, exist_ok=True)
        return target

    def save_page_image(self, doc_id: str, page_number: int, png_bytes: bytes) -> Path:
        target = self._package(doc_id) / VISION_DIR
        target.mkdir(parents=True, exist_ok=True)
        path = target / f"page_{page_number}.png"
        path.write_bytes(png_bytes)
        return path

    def get_page_image(self, doc_id: str, page_number: int) -> Path | None:
        path = self._package(doc_id) / VISION_DIR / f"page_{page_number}.png"
        return path if path.exists() else None

    def save_geometry(self, doc_id: str, geometry: dict[str, Any]) -> None:
        write_json(self._package(doc_id) / VISION_DIR / GEOMETRY_FILE, geometry)

    def load_geometry(self, doc_id: str) -> dict[str, Any] | None:
        return read_json(self._package(doc_id) / VISION_DIR / GEOMETRY_FILE)

    def clear(self, doc_id: str) -> None:
        shutil.rmtree(self._package(doc_id), ignore_errors=True)
