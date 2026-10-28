"""L3 배선 테스트 골격 — 컨테이너 조립 · 라우터 DI · 부팅 시퀀스.

L3 가 지키는 것: **조립이 실제로 맞물리는가.** 행동의 정확성은 L2 가 이미 봤다.
여기서는 "주입이 닿는가 / 부팅이 순서대로 도는가 / HTTP 계약이 맞는가"만 본다.

등급 예산은 전체 5초이고, **기본 실행(`pnpm test`)에서 제외된다.**
그래서 모든 테스트에 `@pytest.mark.wiring` 이 붙는다.

판정: "정적으로 증명되는가?" 아니오 → "앱을 부팅해야 하는가?" **예** → L3

정본: workbench/07.test_strategy/spec/02.tiers/04.L3-wiring.md
실제 예: workbench/07.test_strategy/examples/03.L3-resume-flow.md
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.wiring  # 모듈 전체가 L3 다


# ── 1. 부팅 시퀀스 ───────────────────────────────────────────────────────────


def test_boot_did_what_it_must(api_client) -> None:                  # ← 이름을 바꾼다
    """<한 줄: 부팅이 보장하는 사실>

    <사고 기록>

    `api_client` 는 **세션 스코프이며 lifespan 을 실제로 실행한다.**
    전역 `TestClient(app)` 을 새로 만들지 않는다 — 그러면 lifespan 이 돌지 않아
    프로덕션에 없는 상태를 검증하게 된다.
    """
    import main

    # 부팅이 등록했어야 할 것을 **부팅 결과에서** 확인한다.
    registered = set(main.app.container.agent_runtime()._resume_handlers)

    assert "documents.extract_outline" in registered


# ── 2. 라우터 DI — 주입이 닿는가 ─────────────────────────────────────────────


def test_router_uses_the_injected_service(api_client) -> None:
    """전역 인스턴스가 아니라 컨테이너가 준 것을 쓰는지 본다.

    응답 내용의 정확성은 L2 가 본다. 여기서는 **경로가 연결되어 있는가**만 본다.
    """
    response = api_client.get("/api/v1/runtime/agreements/pending")

    assert response.status_code == 200


# ── 3. 대역을 끼우는 경우 — override 는 컨테이너로 ───────────────────────────


def test_overridden_double_takes_the_same_path(api_client) -> None:
    """서비스를 갈아끼우는 지점도 컨테이너 하나다."""
    from dependency_injector import providers

    import main

    class _Fake:
        def get_all_workspaces(self) -> list[dict[str, object]]:
            return []

    with main.container.workspace_service.override(providers.Object(_Fake())):
        response = api_client.get("/api/v1/workspaces")

    assert response.status_code == 200
    assert response.json() == []


# ── 이 등급에서 하지 않는 것 ─────────────────────────────────────────────────
#
# ✗ 계산 결과의 정확성 검증        → L2 에서 이미 봤다. 여기서 또 보면 두 배로 깨진다
# ✗ `client = TestClient(app)` 전역 → lifespan 이 돌지 않는다
# ✗ 실제 LLM/CLI 실행               → spec/05.fixtures/02.external-boundaries.md
# ✗ 마커 누락                        → 기본 실행에 섞여 들어가 예산을 깬다
