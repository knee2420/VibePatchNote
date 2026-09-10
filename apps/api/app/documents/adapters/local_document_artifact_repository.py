"""LLM 산출물 저장소 어댑터 (불변 아티팩트 + HEAD 포인터).

    data/knowledge/documents/{doc_id}/artifacts/{kind}/
      ├── HEAD.json              현재 채택본 포인터
      └── {artifact_id}/
          ├── provenance.json    무엇이 어떤 조건으로 만들었는가
          └── ...                산출물 파일들 (이름은 유스케이스가 정한다)

캐시가 아니라 아티팩트다. 같은 입력으로 다시 돌려도 바이트가 같지 않고 비용이
들기 때문에, 덮어쓰지 않고 새 버전을 쌓은 뒤 HEAD 만 옮긴다. 그래야 모델을 바꿨을 때
이전 결과와 나란히 놓고 비교할 수 있다.

이 저장소는 산출물의 **의미**를 모른다. 파일 이름과 내용은 유스케이스가 정하고,
여기서는 확장자만 보고 직렬화 방식을 고른다.
"""
from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Any

from app.core.storage import (
    ARTIFACT_PREFIX,
    new_id,
    read_json,
    safe_segment,
    write_json,
)

from ..models import ArtifactHead, ArtifactKind, ArtifactProvenance

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = "artifacts"
HEAD_FILE = "HEAD.json"
PROVENANCE_FILE = "provenance.json"


class LocalDocumentArtifactRepository:
    """아티팩트 커밋과 HEAD 관리."""

    def __init__(self, root_dir: Path) -> None:
        self._root = root_dir

    # --- 쓰기 -----------------------------------------------------------

    def commit(
        self,
        doc_id: str,
        kind: ArtifactKind,
        files: dict[str, Any],
        provenance: ArtifactProvenance,
        *,
        set_head: bool = True,
    ) -> ArtifactProvenance:
        """새 아티팩트를 커밋하고 HEAD 를 옮긴다."""
        artifact_id = provenance.artifact_id or new_id(ARTIFACT_PREFIX)
        provenance = provenance.model_copy(update={"artifact_id": artifact_id, "doc_id": doc_id})

        target = self._kind_dir(doc_id, kind) / artifact_id
        if (target / PROVENANCE_FILE).exists():
            # 커밋된 아티팩트는 바뀌지 않는다. 덮어쓰면 그 결과를 만든 조건과 산출물이
            # 어긋나고, 이전 결과와 비교할 기준선이 사라진다.
            raise FileExistsError(f"Artifact already committed: {kind}/{artifact_id}")
        target.mkdir(parents=True, exist_ok=True)

        for name, payload in files.items():
            self._write_file(target / name, payload)

        # provenance 를 마지막에 쓴다. 이 파일의 존재가 곧 '완성된 아티팩트'의 표식이다.
        write_json(target / PROVENANCE_FILE, provenance.model_dump(mode="json", by_alias=True))

        if set_head:
            write_json(
                self._kind_dir(doc_id, kind) / HEAD_FILE,
                ArtifactHead(artifact_id=artifact_id).model_dump(mode="json", by_alias=True),
            )
        logger.info("[Artifacts] %s/%s 커밋: %s", doc_id, kind, artifact_id)
        return provenance

    def delete_all(self, doc_id: str) -> None:
        target = self._root / safe_segment(doc_id) / ARTIFACTS_DIR
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)

    # --- 읽기 -----------------------------------------------------------

    def head_id(self, doc_id: str, kind: ArtifactKind) -> str | None:
        raw = read_json(self._kind_dir(doc_id, kind) / HEAD_FILE)
        if not raw:
            return None
        try:
            return ArtifactHead.model_validate(raw).artifact_id
        except ValueError:
            return None

    def load_head(self, doc_id: str, kind: ArtifactKind) -> dict[str, Any] | None:
        artifact_id = self.head_id(doc_id, kind)
        if artifact_id is None:
            return None
        return self.load(doc_id, kind, artifact_id)

    def load(self, doc_id: str, kind: ArtifactKind, artifact_id: str) -> dict[str, Any] | None:
        target = self._kind_dir(doc_id, kind) / safe_segment(artifact_id)
        provenance_raw = read_json(target / PROVENANCE_FILE)
        if not provenance_raw:
            return None

        loaded: dict[str, Any] = {"provenance": provenance_raw}
        for path in sorted(target.iterdir()):
            if not path.is_file() or path.name == PROVENANCE_FILE:
                continue
            loaded[path.name] = self._read_file(path)
        return loaded

    def list_versions(self, doc_id: str, kind: ArtifactKind) -> list[ArtifactProvenance]:
        kind_dir = self._kind_dir(doc_id, kind)
        if not kind_dir.exists():
            return []
        versions: list[ArtifactProvenance] = []
        for target in kind_dir.iterdir():
            if not target.is_dir():
                continue
            raw = read_json(target / PROVENANCE_FILE)
            if not raw:
                continue
            try:
                versions.append(ArtifactProvenance.model_validate(raw))
            except ValueError:
                logger.warning("[Artifacts] 해석할 수 없는 provenance: %s", target.name)
        return sorted(versions, key=lambda item: item.created_at, reverse=True)

    # --- 내부 -----------------------------------------------------------

    def _kind_dir(self, doc_id: str, kind: ArtifactKind) -> Path:
        return self._root / safe_segment(doc_id) / ARTIFACTS_DIR / safe_segment(kind)

    @staticmethod
    def _write_file(path: Path, payload: Any) -> None:
        if isinstance(payload, (dict, list)):
            write_json(path, payload)
        elif isinstance(payload, bytes):
            path.write_bytes(payload)
        else:
            path.write_text(str(payload), encoding="utf-8")

    @staticmethod
    def _read_file(path: Path) -> Any:
        if path.suffix == ".json":
            return read_json(path)
        if path.suffix in {".png", ".jpg", ".jpeg", ".pdf"}:
            return path.read_bytes()
        return path.read_text(encoding="utf-8")
