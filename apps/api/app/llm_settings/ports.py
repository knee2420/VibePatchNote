"""LLM 설정 도메인이 외부 저장소에 요구하는 계약."""
from typing import Protocol


class RuntimePolicyRepository(Protocol):
    def load(self) -> dict[str, object] | None: ...

    def save(self, policy: dict[str, object]) -> None: ...


class AgyStatusLineSettings(Protocol):
    def is_installed(self) -> bool: ...

    def install(self) -> str: ...


class AgyUsagePort(Protocol):
    def read(self) -> dict[str, object]: ...


class GoogleModelCatalogPort(Protocol):
    def list_models(self) -> list[dict[str, object]]: ...
