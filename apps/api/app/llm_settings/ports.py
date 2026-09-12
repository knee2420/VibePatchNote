from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol


class CredentialStorePort(Protocol):
    """Google API 키 등 보안 자격증명 저장소 계약."""

    def get_google_api_key(self) -> str | None: ...
    def set_google_api_key(self, api_key: str) -> None: ...
    def delete_google_api_key(self) -> None: ...


class ProviderStatePort(Protocol):
    """공급자별 일시적 사용 불가(레이트 리밋/차단) 상태 조회 계약."""

    def blocked_until(self, provider_id: str) -> datetime | None: ...
    def block_reason(self, provider_id: str) -> str | None: ...


class CliAvailabilityPort(Protocol):
    """CLI 쿼터 잔여 여부 확인 계약."""

    def check(self, model: str) -> Any: ...


class AgyStatusSnapshotPort(Protocol):
    """AGY CLI 상태 스냅샷 조회 계약."""

    def read(self) -> dict[str, Any] | None: ...


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


class GoogleQuotaPort(Protocol):
    def authorization_url(self) -> str: ...
    def complete(self, code: str, state: str) -> None: ...
    def status(self) -> dict[str, object]: ...
    def read(self) -> dict[str, object]:
        """프로젝트 tier 의 모델별 한도. 값이 없는 칸은 None, -1 은 무제한.

        ``{"projectId", "checkedAt", "tier", "billingEnabled",
        "quotas": [{"model", "rpm", "tpm", "rpd", "recentTokens"}]}``
        """
        ...
    def set_client_secret(self, client_secret: str) -> None: ...
