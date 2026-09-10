"""원자적 파일 쓰기와 JSON/JSONL 공통 입출력.

프로세스가 쓰는 도중에 죽으면 반쯤 쓰인 JSON 이 남는다. 그 파일은 다음 부팅에서
읽기 실패로 나타나고, 실패를 "파일 없음"과 구분하지 못하면 사용자 데이터가
조용히 초기화된다. 그래서 쓰기는 항상 임시 파일에 마친 뒤 교체한다.

append 계열(JSONL)은 원자적 교체를 쓰지 않는다. 한 줄 추가는 그 자체로
되돌릴 필요가 없고, 이력을 통째로 다시 쓰는 편이 더 위험하기 때문이다.
"""
from __future__ import annotations

import json
import logging
import os
import tempfile
import threading
from pathlib import Path
from typing import Any, Iterable, Iterator

logger = logging.getLogger(__name__)

_path_locks_guard = threading.Lock()
_path_locks: dict[Path, threading.Lock] = {}


def _lock_for(path: Path) -> threading.Lock:
    """같은 프로세스에서 같은 파일을 교체하는 작업을 직렬화한다."""
    key = path.resolve()
    with _path_locks_guard:
        return _path_locks.setdefault(key, threading.Lock())


def write_json(path: Path, payload: Any) -> None:
    """JSON 을 원자적으로 기록한다 (임시 파일 → 교체)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = _lock_for(path)

    # PID만으로 이름을 만들면 같은 프로세스의 두 스레드가 같은 임시 파일을
    # 덮어쓴다. 대상과 같은 디렉터리에 유일한 파일을 만들어 replace 원자성을
    # 유지하면서 작성자끼리 충돌하지 않게 한다.
    with lock:
        fd, temporary_name = tempfile.mkstemp(
            prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
        )
        temporary = Path(temporary_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, path)
        finally:
            if temporary.exists():
                temporary.unlink(missing_ok=True)


def read_json(path: Path, default: Any = None) -> Any:
    """JSON 을 읽는다. 없거나 깨졌으면 기본값을 돌려준다."""
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        logger.warning("[storage] 손상된 JSON 을 건너뜁니다 (%s): %s", path, exc)
        return default


def append_jsonl(path: Path, record: Any) -> None:
    """이력 한 줄을 덧붙인다."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> Iterator[dict[str, Any]]:
    """이력을 기록 순서대로 읽는다. 깨진 줄은 건너뛴다."""
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except ValueError:
                logger.warning("[storage] 손상된 JSONL 줄을 건너뜁니다 (%s)", path)


def iter_jsonl_files(paths: Iterable[Path]) -> Iterator[dict[str, Any]]:
    """여러 이력 파일을 순서대로 이어 읽는다."""
    for path in paths:
        yield from read_jsonl(path)
