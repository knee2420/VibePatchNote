"""저장소 레이아웃 마이그레이션.

Alembic / Flyway 관행을 따른다 — **버전이 있고, 순서가 있고, 저장소에 커밋되며,
사람이 명시적으로 실행한다.** 읽는 김에 조용히 변환하는 방식(lazy migration)은
언제 끝나는지 아무도 모르고, 폴백 코드가 영구히 남는다.

각 단계는 자기 시대의 규칙을 스스로 들고 있다. 앱 코드를 import 하면 앱이 바뀔 때
과거 마이그레이션의 동작이 함께 바뀌어 재현되지 않는다.

    python -m migrations status
    python -m migrations migrate
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable, NamedTuple

from . import v0001_xdg_layout, v0002_document_id

logger = logging.getLogger(__name__)

VERSION_FILE = ".storage_version"


class Migration(NamedTuple):
    version: int
    name: str
    run: Callable[[Path], None]


MIGRATIONS: tuple[Migration, ...] = (
    Migration(1, "xdg_layout", v0001_xdg_layout.run),
    Migration(2, "document_id", v0002_document_id.run),
)

TARGET_VERSION = MIGRATIONS[-1].version


def read_version(base_dir: Path) -> int | None:
    try:
        return int((base_dir / "data" / VERSION_FILE).read_text(encoding="utf-8").strip())
    except (OSError, ValueError):
        return None


def write_version(base_dir: Path, version: int) -> None:
    target = base_dir / "data" / VERSION_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(str(version), encoding="utf-8")


def migrate(base_dir: Path) -> list[str]:
    """미적용 단계를 순서대로 실행한다. 이미 최신이면 아무것도 하지 않는다."""
    current = read_version(base_dir) or 0
    applied: list[str] = []
    for migration in MIGRATIONS:
        if migration.version <= current:
            continue
        logger.info("[Migration] v%d %s 적용 중...", migration.version, migration.name)
        migration.run(base_dir)
        write_version(base_dir, migration.version)
        applied.append(f"v{migration.version} {migration.name}")
    return applied
