from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from app.core.storage import read_json, write_json


def test_concurrent_writes_leave_valid_json(tmp_path: Path) -> None:
    """같은 프로세스의 동시 저장도 임시 파일 충돌 없이 완결돼야 한다."""
    target = tmp_path / "state.json"

    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(lambda index: write_json(target, {"writer": index}), range(40)))

    saved = read_json(target)
    assert isinstance(saved, dict)
    assert isinstance(saved.get("writer"), int)
    assert not list(tmp_path.glob(".state.json.*.tmp"))
