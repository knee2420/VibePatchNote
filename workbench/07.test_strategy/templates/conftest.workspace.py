"""워크스페이스 공용 픽스처 템플릿 — `<workspace>/tests/conftest.py` 로 복사한다.

이 파일이 보장하는 것은 셋뿐이다.

    1. 테스트는 개발 PC 의 실제 `data/` 에 쓰지 않는다.
    2. 저장소 준비(`storage`)를 파일마다 다시 짜지 않는다.
    3. 앱을 부팅하는 테스트는 **lifespan 을 실제로 실행한다**.

정본: `workbench/07.test_strategy/spec/05.fixtures/README.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 이 템플릿을 복사할 때 지켜야 할 순서

    환경 변수 설정  →  `app.core.config` 임포트  →  나머지

`settings` 는 모듈 임포트 시점에 환경 변수를 한 번 읽는다. 임포트가 먼저 일어나면
등급 루트가 실제 `data/` 로 굳고, 그 뒤에 무엇을 해도 되돌릴 수 없다.
그래서 환경 변수 설정이 **모듈 최상단**에 있고 임포트에 `# noqa: E402` 가 붙는다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

# ── 1. 저장소 격리 (임포트보다 먼저) ─────────────────────────────────────────
#
# `data/` 는 "지우면 복구 불가 · 백업 대상" 등급이다(`60-data/rule.md`).
# 테스트가 거기에 쓰는 것 자체가 등급 위반이고, 실제로 누적된 run 이 목록 상한에
# 밀려 관측 테스트를 통째로 깨뜨린 적이 있다.
# → examples/92.antipattern-real-data.md

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

# 디렉터리는 만들지 않는다. 비어 있어야 부팅이 "새 설치"로 보고 현재 버전을 찍는다.
# 미리 만들면 "버전 없는 비어있지 않은 저장소"가 되어 부팅이 거부된다.


@pytest.fixture(scope="session", autouse=True)
def _isolated_storage():
    """세션이 끝나면 임시 저장소를 통째로 버린다."""
    yield _TEST_STORAGE_ROOT
    shutil.rmtree(_TEST_STORAGE_ROOT, ignore_errors=True)


# ── 2. storage — 등급 루트 (L2 기본 픽스처) ──────────────────────────────────


@pytest.fixture
def storage(tmp_path: Path):
    """테스트 하나만의 등급 루트.

    어댑터에 **주입**할 루트를 준다. 어댑터가 경로를 스스로 만들지 않는다는 것이
    이 픽스처가 강제하는 계약이다.
    """
    from app.core.storage import StorageRoots

    roots = StorageRoots(tmp_path)
    roots.ensure()
    return roots


# ── 3. container — 외부가 끊긴 객체 그래프 (L3 기본 픽스처) ──────────────────


@pytest.fixture
def container(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """외부 I/O 가 차단된 컨테이너.

    차단 지점의 정본은 `spec/05.fixtures/02.external-boundaries.md` 다.
    여기서 즉흥적으로 다른 지점을 막지 않는다 — 지점이 파일마다 달라지면
    "무엇이 진짜 실행되는지"를 아무도 모르게 된다.
    """
    from dependency_injector import providers

    from app.bootstrap.container import Container

    container = Container()
    # 예: 자격 증명은 OS 키링을 건드리지 않는다.
    #   container.credential_store.override(providers.Object(FakeCredentialStore()))
    # 필요한 차단만 골라 쓴다. 목록은 external-boundaries.md 참조.
    _ = providers
    yield container
    container.reset_override()


# ── 4. api_client — 부팅된 앱 (L3 전용) ──────────────────────────────────────


@pytest.fixture(scope="session")
def api_client():
    """**lifespan 을 실제로 실행한** 테스트 클라이언트. 세션당 한 번만 부팅한다.

    `with` 없이 만든 `TestClient(app)` 은 lifespan 을 돌리지 않는다. 그러면 재개
    핸들러 등록도, 정책 복원도, 고아 정리도 일어나지 않은 앱을 검증하게 된다 —
    프로덕션에 존재하지 않는 상태다. 실제로 그 때문에 부팅 순서 버그가 테스트를
    통과했다. → examples/90.antipattern-global-client.md

    `import main` 은 1.6초다. 세션 스코프로 한 번만 문다.
    """
    from fastapi.testclient import TestClient

    import main

    with TestClient(main.app) as client:
        yield client


# ── 5. 이 워크스페이스 고유 픽스처는 이 아래에 ───────────────────────────────
#
# 예: 실제 생산자가 쓴 run 디렉터리를 저장소에 깔아 주는 `observability_runs`.
#     손으로 지은 샘플을 쓰지 않는 이유는
#     spec/05.fixtures/03.observability-fixtures.md 에 있다.
