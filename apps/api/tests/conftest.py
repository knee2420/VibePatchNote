"""테스트 공용 픽스처.

## 저장소 격리

**테스트는 개발 PC 의 `data/` 에 쓰지 않는다.** 예전에는 썼다. 그래서
테스트를 돌릴 때마다 실제 run 이 쌓였고, 66건을 넘긴 순간 목록 상한(50)에
밀려 픽스처 run 이 화면에서 사라지면서 관측 테스트가 통째로 깨졌다 — 코드가
아니라 **개발 PC 의 누적 상태**가 결과를 정한 것이다.

`data/` 는 "지우면 복구 불가 · 백업 대상" 등급이다(`60-data/rule.md`).
테스트가 거기에 쓰는 것 자체가 등급 위반이다. 그래서 등급 루트 네 개를
버려도 되는 임시 디렉터리로 돌린다. 이 설정은 `app.core.config` 가 임포트되기
**전에** 끝나야 하므로 모듈 최상단에 둔다.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

_TEST_STORAGE_ROOT = Path(__file__).resolve().parents[1] / ".pytest_tmp" / f"storage-{os.getpid()}"
for _key, _grade in (
    ("VIBE_CONFIG_DIR", "config"),
    ("VIBE_DATA_DIR", "data"),
    ("VIBE_CACHE_DIR", "cache"),
    ("VIBE_STATE_DIR", "state"),
):
    os.environ[_key] = str(_TEST_STORAGE_ROOT / _grade)

import pytest  # noqa: E402

from app.core.config import settings  # noqa: E402

# 디렉터리는 만들지 않는다. 비어 있어야 `main.verify_storage_version()` 이
# "새 설치"로 보고 현재 버전을 찍는다. 미리 만들면 버전 없는 저장소가 되어
# 부팅이 거부된다 — 조용히 변환하지 않는 것이 그 검사의 의도다.


@pytest.fixture(scope="session", autouse=True)
def _isolated_storage() -> object:
    """세션이 끝나면 임시 저장소를 통째로 버린다."""
    yield _TEST_STORAGE_ROOT
    shutil.rmtree(_TEST_STORAGE_ROOT, ignore_errors=True)

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
        shutil.copytree(src, dst, dirs_exist_ok=True)
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
