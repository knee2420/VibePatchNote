"""다음 AI 작업의 실행 경로 및 공급자 상태 판정 유스케이스."""
from __future__ import annotations

import shutil
from typing import Any, Optional

from app.core.config import settings
from app.core.llm.fallback import PRIMARY_PROVIDER_ID
from app.core.llm.provider_state import remaining_text

from ..ports import CliAvailabilityPort, CredentialStorePort, ProviderStatePort


def mask_key(api_key: str) -> str:
    """키 원문을 응답·로그·브라우저 상태로 전달하지 않는 표시 전용 힌트."""
    return f"{api_key[:4]}••••••••{api_key[-4:]}"


class ResolveNextExecutionUseCase:
    """공급자 가용성, CLI 쿼터, 차단 상태를 종합하여 다음 실행 경로를 결정한다."""

    def __init__(
        self,
        credentials: CredentialStorePort,
        provider_state: Optional[ProviderStatePort] = None,
        cli_availability: Optional[CliAvailabilityPort] = None,
    ) -> None:
        self._credentials = credentials
        self._state = provider_state
        self._cli_availability = cli_availability

    def primary_provider_status(self) -> dict[str, Any]:
        """CLI 는 설치돼 있으면 설정된 것으로 본다. 다만 지금 쓸 수 있는지는 별개다."""
        is_primary = settings.primary_provider not in ("google_api", "google-api")
        status: dict[str, Any] = {
            "id": PRIMARY_PROVIDER_ID,
            "label": "Antigravity CLI",
            "configured": True,
            "role": "primary" if is_primary else "fallback",
            "available": bool(shutil.which(settings.agent_cli_bin)),
        }
        if not status["available"]:
            status["blocked_reason"] = "CLI_NOT_FOUND"
            return status
        if not self._state:
            return status

        until = self._state.blocked_until(PRIMARY_PROVIDER_ID)
        if until is None:
            return status

        status.update(
            {
                "available": False,
                "blocked_reason": self._state.block_reason(PRIMARY_PROVIDER_ID),
                "blocked_until": until.isoformat(),
                "recovers_in": remaining_text(until),
            }
        )
        return status

    def fallback_provider_status(self) -> dict[str, Any]:
        api_key = self._credentials.get_google_api_key()
        configured = bool(api_key)
        is_primary = settings.primary_provider in ("google_api", "google-api")
        until = self._state.blocked_until("google-api") if self._state else None
        available = configured and until is None
        status: dict[str, Any] = {
            "id": "google-api",
            "label": "Google API",
            "configured": configured,
            "masked_key": mask_key(api_key) if api_key else None,
            "role": "primary" if is_primary else "fallback",
            "available": available,
        }
        if until is not None:
            status.update({
                "blocked_reason": self._state.block_reason("google-api") if self._state else "RATE_LIMIT",
                "blocked_until": until.isoformat(),
                "recovers_in": remaining_text(until) if until else None,
            })
        return status

    def execute(self) -> dict[str, Any]:
        """현재 스냅샷 기준 다음 AI 작업의 예상 경로. 실행 이력은 만들지 않는다."""
        is_google_primary = settings.primary_provider in ("google_api", "google-api")
        primary = self.fallback_provider_status() if is_google_primary else self.primary_provider_status()
        secondary = self.primary_provider_status() if is_google_primary else self.fallback_provider_status()

        if is_google_primary:
            if primary.get("available"):
                return {
                    "provider": "google-api",
                    "model": settings.google_api_model,
                    "routeReason": "api_configured",
                }
            return {
                "provider": PRIMARY_PROVIDER_ID if secondary["available"] else None,
                "model": settings.agent_cli_model if secondary["available"] else None,
                "routeReason": "api_unavailable_fallback_to_cli",
            }
        else:
            if not primary.get("available"):
                return {
                    "provider": "google-api" if secondary["available"] else None,
                    "model": settings.google_api_model if secondary["available"] else None,
                    "routeReason": "cli_blocked",
                }
            availability = (
                self._cli_availability.check(settings.agent_cli_model)
                if self._cli_availability
                else None
            )
            if availability and availability.exhausted:
                return {
                    "provider": "google-api" if secondary["available"] else None,
                    "model": settings.google_api_model if secondary["available"] else None,
                    "routeReason": "cli_quota_exhausted",
                }
            return {
                "provider": PRIMARY_PROVIDER_ID,
                "model": settings.agent_cli_model,
                "routeReason": "cli_available" if availability and availability.state == "available" else "cli_quota_unknown",
            }
