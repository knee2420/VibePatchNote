"""테스트 공용 픽스처."""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from app.core.config import settings

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "observability"

@pytest.fixture
def observability_runs() -> list[str]:
    """실제 생산자가 쓴 run 디렉터리를 저장소에 깔고, 끝나면 치운다.

    손으로 지은 샘플을 쓰지 않는 이유는
    `fixtures/observability/README.md` 에 있다 — 요약하면, 생산자가 쓰지 않는
    키로 테스트가 통과하면 그 테스트는 자기가 지어낸 세계를 검증한다.
    """
    runs_dir = settings.storage.runs
    runs_dir.mkdir(parents=True, exist_ok=True)

    copied: list[str] = []
    for src in sorted((FIXTURES / "runs").iterdir()):
        if not src.is_dir():
            continue
        dst = runs_dir / src.name
        if dst.exists():
            shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(src, dst)
        copied.append(src.name)

    try:
        yield copied
    finally:
        for name in copied:
            shutil.rmtree(runs_dir / name, ignore_errors=True)


@pytest.fixture
def observability_ledger() -> Path:
    """월별 원장 픽스처를 저장소에 깔고, 끝나면 치운다."""
    ledger_dir = settings.storage.data / "ledger"
    ledger_dir.mkdir(parents=True, exist_ok=True)

    copied: list[Path] = []
    for src in sorted((FIXTURES / "ledger").glob("*.jsonl")):
        dst = ledger_dir / src.name
        # 실제 원장이 이미 있으면 덮지 않는다. 원장은 영구 데이터다.
        if dst.exists():
            pytest.skip(f"원장이 이미 존재합니다: {dst}")
        shutil.copy2(src, dst)
        copied.append(dst)

    try:
        yield ledger_dir
    finally:
        for path in copied:
            path.unlink(missing_ok=True)
