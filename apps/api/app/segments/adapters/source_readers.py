"""Adapters that read foreign aggregates through injected structural ports."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from ..models import StructureTarget


class LocalDocumentSourceReader:
    """Adapts the documents source repository without importing its domain."""

    def __init__(self, source: Any) -> None:
        self._source = source

    def get_title(self, doc_id: str) -> str | None:
        meta = self._source.get(doc_id)
        return getattr(meta, "original_name", None) if meta is not None else None

    def resolve_file(self, doc_id: str) -> Path:
        return self._source.resolve_file(doc_id)


class LocalOutlineReader:
    """Reads only the outline element projection needed by the mapping algorithm."""

    def __init__(self, artifacts: Any) -> None:
        self._artifacts = artifacts

    def load_elements(self, doc_id: str) -> tuple[str | None, list[StructureTarget]]:
        artifact_id = self._artifacts.head_id(doc_id, "outline")
        artifact = self._artifacts.load_head(doc_id, "outline")
        if not artifact:
            return artifact_id, []
        values = artifact.get("elements.json") or []
        targets: list[StructureTarget] = []
        for value in values:
            if not isinstance(value, dict) or not value.get("id"):
                continue
            targets.append(
                StructureTarget(
                    id=str(value["id"]),
                    page=int(value.get("page") or 1),
                    label=str(value.get("label") or value["id"]),
                    type=str(value.get("type") or "unknown"),
                    box_2d=value.get("box_2d") or value.get("box2d"),
                    artifactId=artifact_id,
                )
            )
        return artifact_id, targets


class LocalWireframeReader:
    """Projects archived wireframe slots into mapping targets."""

    def __init__(self, repository: Any) -> None:
        self._repository = repository

    def load_blocks(self, doc_id: str) -> list[StructureTarget]:
        targets: list[StructureTarget] = []
        for record in self._repository.list_for_document(doc_id):
            contents = self._repository.find_contents(record.scaffold_id)
            if contents is None:
                continue
            for slot in contents.slots:
                targets.append(
                    StructureTarget(
                        # slot id는 서로 다른 스캐폴드에서 반복될 수 있다. 관계 합의의
                        # 대상 키는 반드시 채택된 스캐폴드 리비전까지 포함해야 한다.
                        id=f"{record.scaffold_id}:{slot.id}",
                        page=int(slot.page_number),
                        label=str(slot.label),
                        type="wireframe_slot",
                        box_2d=list(slot.box_2d),
                        scaffoldId=record.scaffold_id,
                    )
                )
        return targets
