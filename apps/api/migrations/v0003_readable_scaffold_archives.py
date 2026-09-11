"""v3 — 스캐폴드 보관 폴더에 사람이 읽을 수 있는 이름과 최신본 목록을 붙인다.

v2의 ``scaffold-{id}`` 폴더는 API에는 안전했지만 탐색기에서 어느 문서의 어느
결과인지 알 수 없었다. 외부 ID는 바꾸지 않고 폴더만
``생성시각__제목__scaffold-ID``로 이름을 바꾼다.
"""
from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any


def run(base_dir: Path) -> None:
    root = base_dir / "data" / "knowledge" / "scaffolds"
    if not root.exists():
        return

    records: list[tuple[Path, dict[str, Any]]] = []
    for directory in root.iterdir():
        if not directory.is_dir():
            continue
        record = _read_json(directory / "manifest.json")
        if isinstance(record, dict) and record.get("scaffold_id"):
            records.append((directory, record))

    for directory, record in records:
        target = root / _archive_dir_name(record)
        if directory == target:
            continue
        if target.exists():
            raise FileExistsError(f"Scaffold archive name collision: {target.name}")
        directory.rename(target)

    _write_catalog(root)


def _archive_dir_name(record: dict[str, Any]) -> str:
    return f"{_timestamp(str(record.get('created_at') or ''))}__{_label(str(record.get('title') or ''))}__{record['scaffold_id']}"


def _timestamp(value: str) -> str:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%Y%m%d-%H%M%S")
    except ValueError:
        return "unknown-time"


def _label(value: str) -> str:
    normalized = unicodedata.normalize("NFC", value or "untitled")
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", normalized)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .-")
    return (cleaned or "untitled")[:48]


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _write_catalog(root: Path) -> None:
    records: list[dict[str, Any]] = []
    for directory in root.iterdir():
        if directory.is_dir():
            record = _read_json(directory / "manifest.json")
            if isinstance(record, dict) and record.get("scaffold_id"):
                records.append(record)
    latest: dict[str, dict[str, Any]] = {}
    for record in records:
        doc_id = str(record.get("doc_id") or "(unknown)")
        changed = str(record.get("updated_at") or record.get("created_at") or "")
        if doc_id not in latest or changed > str(latest[doc_id].get("updated_at") or latest[doc_id].get("created_at") or ""):
            latest[doc_id] = record

    lines = [
        "# 스캐폴드 보관함", "",
        "각 폴더는 `생성시각__제목__scaffold-ID` 형식입니다. ID는 API와 캔버스가 참조하는 고정 식별자이며, 제목·시각은 탐색기에서 빠르게 구분하기 위한 표시값입니다.", "",
        "## 문서별 최신 작업본", "",
        "| 원본 문서 ID | 최신 스캐폴드 | 마지막 변경 | 폴더 |", "| --- | --- | --- | --- |",
    ]
    for doc_id, record in sorted(latest.items(), key=lambda item: str(item[1].get("updated_at") or item[1].get("created_at") or ""), reverse=True):
        lines.append(f"| {doc_id} | {record.get('title', '')} | {record.get('updated_at') or record.get('created_at') or ''} | {_archive_dir_name(record)} |")
    lines.extend(["", "## 전체 생성 이력", "", "| 생성 시각 | 원본 문서 ID | 제목 | 작업본 수정 | 폴더 |", "| --- | --- | --- | --- | --- |"])
    for record in sorted(records, key=lambda item: str(item.get("created_at") or ""), reverse=True):
        lines.append(f"| {record.get('created_at', '')} | {record.get('doc_id', '')} | {record.get('title', '')} | {record.get('updated_at') or '-'} | {_archive_dir_name(record)} |")
    (root / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
