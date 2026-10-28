"""로컬 파일 시스템 기반 원본 문서 저장소 어댑터.

    data/knowledge/documents/{doc_id}/
      ├── meta.json     원래 파일명 · 내용 지문 · mime · 업로드 시각
      └── source.{ext}  원본 그대로

경로에 파일명을 쓰지 않는다. 이름은 `meta.json` 안에서만 산다. 그래야 이름을
바꿔도 같은 문서로 남고, 한글·공백·콜론이 섞인 이름도 손실 없이 보존된다.
"""
from __future__ import annotations

import hashlib
import logging
import mimetypes
import shutil
from pathlib import Path

from app.core.storage import (
    DOCUMENT_PREFIX,
    new_id,
    read_json,
    safe_segment,
    write_json,
)

from ..models import DocumentMeta

logger = logging.getLogger(__name__)

META_FILE = "meta.json"
SOURCE_STEM = "source"


class LocalDocumentSourceRepository:
    """원본 패키지의 발급·조회·삭제를 전담한다."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    # --- 쓰기 -----------------------------------------------------------

    def save(self, filename: str, content: bytes) -> DocumentMeta:
        """원본을 새 패키지에 넣는다. 같은 내용이 이미 있으면 그것을 재사용한다."""
        name = self._safe_original_name(filename)
        digest = hashlib.sha256(content).hexdigest()

        existing = self._find_by_sha256(digest)
        if existing is not None:
            # 같은 파일을 다시 올린 것이다. 새 패키지를 만들면 분석 결과가 갈라진다.
            logger.info("[Documents] 동일 내용 재업로드 — 기존 패키지 재사용: %s", existing.doc_id)
            return existing

        doc_id = new_id(DOCUMENT_PREFIX)
        package = self._package(doc_id)
        package.mkdir(parents=True, exist_ok=True)

        suffix = Path(name).suffix
        stored_name = f"{SOURCE_STEM}{suffix}"
        (package / stored_name).write_bytes(content)

        meta = DocumentMeta(
            doc_id=doc_id,
            original_name=name,
            stored_name=stored_name,
            sha256=digest,
            mime=mimetypes.guess_type(name)[0] or "application/octet-stream",
            size=len(content),
        )
        write_json(package / META_FILE, meta.model_dump(mode="json", by_alias=True))
        return meta

    def delete(self, doc_id: str) -> bool:
        package = self._package(doc_id)
        if not package.exists():
            return False
        shutil.rmtree(package, ignore_errors=True)
        return True

    # --- 읽기 -----------------------------------------------------------

    def get(self, doc_id: str) -> DocumentMeta | None:
        return self._read_meta(self._package(doc_id))

    def find_by_name(self, filename: str) -> DocumentMeta | None:
        """사람이 읽는 이름으로 찾는다. 같은 이름이 여럿이면 가장 최근 것.

        레거시 클라이언트가 아직 파일명으로 요청하는 동안만 쓰는 통로다.
        """
        target = Path(filename).name
        matches = [meta for meta in self.list_all() if meta.original_name == target]
        if not matches:
            # 확장자 없이 요청한 경우까지만 관대하게 받아 준다.
            stem = Path(target).stem
            matches = [meta for meta in self.list_all() if Path(meta.original_name).stem == stem]
        if not matches:
            return None
        return max(matches, key=lambda meta: meta.uploaded_at)

    def list_all(self) -> list[DocumentMeta]:
        if not self._root.exists():
            return []
        found: list[DocumentMeta] = []
        for package in self._root.iterdir():
            if not package.is_dir():
                continue
            meta = self._read_meta(package)
            if meta is not None:
                found.append(meta)
        return sorted(found, key=lambda meta: meta.uploaded_at, reverse=True)

    def resolve_file(self, doc_id: str) -> Path:
        meta = self.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        candidate = self._package(doc_id) / meta.stored_name
        if not candidate.is_file():
            raise FileNotFoundError(f"Document source missing: {doc_id}")
        return candidate

    # --- 내부 -----------------------------------------------------------

    def _package(self, doc_id: str) -> Path:
        return self._root / safe_segment(doc_id)

    def _read_meta(self, package: Path) -> DocumentMeta | None:
        raw = read_json(package / META_FILE)
        if not raw:
            return None
        try:
            return DocumentMeta.model_validate(raw)
        except ValueError as exc:
            logger.warning("[Documents] 해석할 수 없는 meta.json (%s): %s", package.name, exc)
            return None

    def _find_by_sha256(self, digest: str) -> DocumentMeta | None:
        for meta in self.list_all():
            if meta.sha256 == digest:
                return meta
        return None

    @staticmethod
    def _safe_original_name(filename: str) -> str:
        candidate = Path(filename or "").name
        if not candidate or candidate in {".", ".."}:
            raise ValueError("Invalid file name")
        return candidate
