"""경계를 지키는 것은 계약이고, 계약이 낡지 않게 지키는 것은 이 테스트다.

`import-linter` 계약은 모듈 이름을 **손으로 열거**한다. 열거는 조용히 낡는다 —
새 도메인이 생겨도 어느 계약에도 적히지 않고, 그래서 아무 경고 없이 규칙 밖에서
자란다. 실제로 `inspector` 가 그랬다. 컨테이너를 거치지 않고 서비스가 저장 경로를
직접 열어도, 다른 도메인의 저장 레이아웃을 디스크 수준에서 읽어도 `pnpm lint` 는
초록이었다. 목록에 없었기 때문이다.

그래서 **디스크의 도메인 목록과 계약의 도메인 목록이 같은지**를 여기서 확인한다.
계약이 낡으면 lint 가 아니라 이 테스트가 먼저 깨진다.
"""
from __future__ import annotations

import tomllib
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = API_ROOT / "app"

#: 도메인이 아닌 최상위 패키지. bootstrap 은 조립 지점이고 core 는 도메인 무관
#: 인프라다. 둘 다 정의상 여러 도메인을 알거나, 아무 도메인도 모른다.
NOT_A_DOMAIN = {"bootstrap", "core"}

#: 도메인 안에서 다른 도메인을 참조해서는 안 되는 세그먼트.
#: `router.py` 는 빠진다 — 라우터는 조립 지점을 통해 주입을 받고, 컨테이너는
#: 정의상 모든 도메인을 안다.
GUARDED_SEGMENTS = ("service.py", "use_cases", "adapters", "agents", "experimental", "ports.py")


def _domains_on_disk() -> set[str]:
    return {
        entry.name
        for entry in APP_ROOT.iterdir()
        if entry.is_dir()
        and entry.name not in NOT_A_DOMAIN
        and not entry.name.startswith(("_", "."))
        and (entry / "__init__.py").exists()
    }


def _contracts() -> list[dict]:
    raw = tomllib.loads((API_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    return raw["tool"]["importlinter"]["contracts"]


def _independence_contracts() -> dict[str, dict]:
    found: dict[str, dict] = {}
    for contract in _contracts():
        name = contract.get("name", "")
        if name.endswith("must not depend on other domains"):
            found[name.split(" ", 1)[0]] = contract
    return found


def test_every_domain_has_an_independence_contract() -> None:
    """새 도메인은 규칙 밖에서 태어나지 않는다."""
    assert _independence_contracts().keys() == _domains_on_disk()


def test_each_contract_forbids_every_other_domain() -> None:
    """한 도메인만 빠뜨려도 그 짝은 영영 검사되지 않는다."""
    domains = _domains_on_disk()
    for domain, contract in _independence_contracts().items():
        expected = {f"app.{other}" for other in domains if other != domain}
        assert set(contract["forbidden_modules"]) == expected, domain


def test_contracts_guard_every_existing_segment() -> None:
    """계약이 실제로 존재하는 세그먼트를 전부 덮는지 확인한다.

    세그먼트를 새로 만들고 계약에 적지 않으면, 그 세그먼트는 검사되지 않는다.
    """
    for domain, contract in _independence_contracts().items():
        expected = {
            f"app.{domain}." + (segment[:-3] if segment.endswith(".py") else segment)
            for segment in GUARDED_SEGMENTS
            if (APP_ROOT / domain / segment).exists()
        }
        assert set(contract["source_modules"]) == expected, domain


def test_storage_path_contract_is_written_in_segments_not_domain_names() -> None:
    """저장 경로 계약은 도메인을 열거하지 않는다.

    열거하면 목록에 없는 도메인이 `settings.storage` 를 직접 열어도 통과한다.
    실제로 그래서 `inspector` 가 run 디렉터리를 손으로 훑고 있었다.
    """
    contract = next(
        c for c in _contracts() if c["name"].startswith("Storage paths are known only")
    )
    assert all(module.startswith("app.*.") for module in contract["source_modules"])
    assert contract["forbidden_modules"] == ["app.core.config"]
