"""LLM 보조 프로바이더 설정 유스케이스. 비밀 값은 절대 응답하지 않는다."""
from __future__ import annotations

import shutil
from typing import Any, Optional

from scaffold_engine.harness import MODEL_REGISTRY

from app.core.config import settings
from app.core.llm import AgyStatusSnapshot
from app.core.llm.availability import CliQuotaAvailability
from app.core.llm.credentials import CredentialStore
from app.core.llm.fallback import PRIMARY_PROVIDER_ID
from app.core.llm.provider_state import ProviderStateStore, remaining_text

from .ports import (
    AgyStatusLineSettings,
    AgyUsagePort,
    GoogleModelCatalogPort,
    GoogleQuotaPort,
    RuntimePolicyRepository,
)
from .use_cases import ReadGoogleProjectUsageUseCase


class LlmSettingsService:
    def __init__(
        self,
        credentials: CredentialStore,
        provider_state: Optional[ProviderStateStore] = None,
        agy_status: Optional[AgyStatusSnapshot] = None,
        runtime_policy: Optional[RuntimePolicyRepository] = None,
        agy_status_line: Optional[AgyStatusLineSettings] = None,
        agy_usage: Optional[AgyUsagePort] = None,
        google_models: Optional[GoogleModelCatalogPort] = None,
        google_quotas: Optional[GoogleQuotaPort] = None,
        google_usage: Optional[ReadGoogleProjectUsageUseCase] = None,
        cli_availability: Optional[CliQuotaAvailability] = None,
    ) -> None:
        self._credentials = credentials
        self._state = provider_state
        self._agy_status = agy_status
        self._runtime_policy = runtime_policy
        self._agy_status_line = agy_status_line
        self._agy_usage = agy_usage
        self._google_models = google_models
        self._google_quotas = google_quotas
        self._google_usage = google_usage
        self._cli_availability = cli_availability
        self._restore_runtime_policy()

    def list_providers(self) -> dict[str, object]:
        return {"providers": [self._primary(), self._fallback()]}

    def runtime_dashboard(self) -> dict[str, object]:
        """키 원문 없이 현재 실행 정책과 모델 카탈로그를 한 화면 계약으로 제공한다."""
        known_ids = set()
        models = []
        for spec in MODEL_REGISTRY.values():
            known_ids.add(spec.name)
            prov = "google-api" if spec.provider in ("google_api", "google-api") else ("agy-cli" if spec.provider in ("agy_cli", "agy-cli") else spec.provider)
            models.append({
                "id": spec.name,
                "label": spec.display_name or spec.name,
                "provider": prov,
                "inputTokenLimit": spec.max_input_tokens,
                "outputTokenLimit": spec.max_output_tokens,
                "supportsStructuredOutput": spec.supports_structured_schema,
            })

        # 환경 변수나 커스텀 설정으로 레지스트리에 없는 새 모델이 지정된 경우에만 추가
        if settings.google_api_model and settings.google_api_model not in known_ids:
            models.append({
                "id": settings.google_api_model,
                "label": f"Google API · {settings.google_api_model}",
                "provider": "google-api",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportsStructuredOutput": True,
            })
            known_ids.add(settings.google_api_model)
        is_google_primary = settings.primary_provider in ("google_api", "google-api")
        primary_provider_id = "google-api" if is_google_primary else PRIMARY_PROVIDER_ID
        fallback_provider_id = PRIMARY_PROVIDER_ID if is_google_primary else "google-api"
        primary_model = settings.google_api_model if is_google_primary else settings.agent_cli_model
        primary_timeout = settings.google_api_timeout_seconds if is_google_primary else settings.agent_cli_timeout_seconds
        fallback_model = settings.agent_cli_model if is_google_primary else settings.google_api_model
        fallback_timeout = settings.agent_cli_timeout_seconds if is_google_primary else settings.google_api_timeout_seconds

        return {
            "providers": [self._primary(), self._fallback()],
            "models": models,
            "policy": {
                "primaryProvider": primary_provider_id,
                "primaryModel": primary_model,
                "primaryTimeoutSeconds": primary_timeout,
                "fallbackProvider": fallback_provider_id,
                "fallbackModel": fallback_model,
                "fallbackTimeoutSeconds": fallback_timeout,
            },
            "quotaNotice": "정확한 잔여 호출 수는 API 키에서 제공되지 않습니다. 프로젝트별 한도와 상세 사용량은 Google AI Studio에서 확인하며, 여기서는 실제 차단 상태와 복구 예정 시각을 표시합니다.",
            "agyStatus": self._agy_status.read() if self._agy_status else None,
            "agyStatusBridgeCommand": f'python "{settings.base_dir / "scripts" / "agy_status_bridge.py"}"',
            "agyStatusLineInstalled": self._agy_status_line.is_installed() if self._agy_status_line else False,
            "nextExecution": self._next_execution(),
        }

    def install_agy_status_line(self) -> dict[str, object]:
        if not self._agy_status_line:
            raise RuntimeError("AGY status-line 자동 등록을 사용할 수 없습니다.")
        return {"settingsFile": self._agy_status_line.install(), "installed": True}

    def agy_usage(self) -> dict[str, object]:
        if not self._agy_usage:
            raise RuntimeError("AGY 사용량 조회를 사용할 수 없습니다.")
        return self._agy_usage.read()

    def google_api_models(self) -> dict[str, object]:
        if not self._google_models:
            raise RuntimeError("Google API 모델 조회를 사용할 수 없습니다.")
        return {"models": self._google_models.list_models()}

    def google_quota_authorization_url(self) -> dict[str, object]:
        if not self._google_quotas:
            raise RuntimeError("Google 한도 연결을 사용할 수 없습니다.")
        return {"authorizationUrl": self._google_quotas.authorization_url()}

    def complete_google_quota_authorization(self, code: str, state: str) -> None:
        if not self._google_quotas:
            raise RuntimeError("Google 한도 연결을 사용할 수 없습니다.")
        self._google_quotas.complete(code, state)

    def google_quota_status(self) -> dict[str, object]:
        if not self._google_quotas:
            raise RuntimeError("Google 한도 연결을 사용할 수 없습니다.")
        return self._google_quotas.status()

    def google_project_usage(self) -> dict[str, object]:
        """이 API 키로 쓸 수 있고 지금 제공 중인 모델의 프로젝트 한도."""
        if not self._google_usage:
            raise RuntimeError("Google 한도 연결을 사용할 수 없습니다.")
        return self._google_usage.execute()

    def configure_google_oauth_client_secret(self, client_secret: str) -> dict[str, object]:
        if not self._google_quotas:
            raise RuntimeError("Google 한도 연결을 사용할 수 없습니다.")
        self._google_quotas.set_client_secret(client_secret)
        return self._google_quotas.status()

    def configure_google_api(self, api_key: str) -> dict[str, object]:
        self._credentials.set_google_api_key(api_key)
        return {"id": "google-api", "label": "Google API", "configured": True, "role": "fallback"}

    def update_runtime_policy(
        self,
        primary_model: str,
        primary_timeout_seconds: int,
        fallback_model: str,
        fallback_timeout_seconds: int,
        primary_provider: Optional[str] = None,
        fallback_provider: Optional[str] = None,
    ) -> dict[str, object]:
        """현재 API 프로세스의 실행 정책을 갱신한다. 비밀 값은 취급하지 않는다."""
        if primary_provider:
            cleaned_p = primary_provider.strip().lower().replace("-", "_")
            if cleaned_p in ("google_api", "googleapi", "google"):
                if not self._credentials.get_google_api_key():
                    raise ValueError("Google API를 기본 실행 엔진으로 지정하려면 먼저 Google API 키를 등록해야 합니다.")
                settings.primary_provider = "google_api"
            elif cleaned_p in ("agy_cli", "cli", "agycli", "agy"):
                settings.primary_provider = "agy_cli"

        if fallback_provider:
            cleaned_f = fallback_provider.strip().lower().replace("-", "_")
            if cleaned_f in ("google_api", "googleapi", "google"):
                settings.fallback_provider = "google_api"
            elif cleaned_f in ("agy_cli", "cli", "agycli", "agy"):
                settings.fallback_provider = "agy_cli"

        is_google_primary = settings.primary_provider in ("google_api", "google-api")
        if is_google_primary:
            settings.google_api_model = primary_model
            settings.google_api_timeout_seconds = primary_timeout_seconds
            settings.agent_cli_model = fallback_model
            settings.agent_cli_timeout_seconds = fallback_timeout_seconds
        else:
            if primary_model not in MODEL_REGISTRY:
                raise ValueError(f"Unknown primary model: {primary_model}")
            settings.agent_cli_model = primary_model
            settings.agent_cli_timeout_seconds = primary_timeout_seconds
            settings.google_api_model = fallback_model
            settings.google_api_timeout_seconds = fallback_timeout_seconds

        if self._runtime_policy:
            self._runtime_policy.save(self.runtime_dashboard()["policy"])
        return self.runtime_dashboard()["policy"]

    def remove_google_api(self) -> None:
        self._credentials.delete_google_api_key()

    # --- 내부 ---------------------------------------------------------

    def _restore_runtime_policy(self) -> None:
        if not self._runtime_policy:
            return
        saved = self._runtime_policy.load()
        if not saved:
            return

        primary_provider = saved.get("primaryProvider")
        if isinstance(primary_provider, str):
            p_clean = primary_provider.strip().lower().replace("-", "_")
            if p_clean in ("google_api", "agy_cli"):
                settings.primary_provider = p_clean
        fallback_provider = saved.get("fallbackProvider")
        if isinstance(fallback_provider, str):
            f_clean = fallback_provider.strip().lower().replace("-", "_")
            if f_clean in ("google_api", "agy_cli"):
                settings.fallback_provider = f_clean

        is_google_primary = settings.primary_provider in ("google_api", "google-api")
        if is_google_primary:
            primary_model = saved.get("primaryModel")
            if isinstance(primary_model, str) and primary_model:
                settings.google_api_model = primary_model
            fallback_model = saved.get("fallbackModel")
            if isinstance(fallback_model, str) and fallback_model:
                settings.agent_cli_model = fallback_model
            for attribute, key in (
                ("google_api_timeout_seconds", "primaryTimeoutSeconds"),
                ("agent_cli_timeout_seconds", "fallbackTimeoutSeconds"),
            ):
                value = saved.get(key)
                if isinstance(value, int) and 15 <= value <= 600:
                    setattr(settings, attribute, value)
        else:
            primary_model = saved.get("primaryModel")
            if isinstance(primary_model, str) and primary_model in MODEL_REGISTRY:
                settings.agent_cli_model = primary_model
            fallback_model = saved.get("fallbackModel")
            if isinstance(fallback_model, str) and fallback_model:
                settings.google_api_model = fallback_model
            for attribute, key in (
                ("agent_cli_timeout_seconds", "primaryTimeoutSeconds"),
                ("google_api_timeout_seconds", "fallbackTimeoutSeconds"),
            ):
                value = saved.get(key)
                if isinstance(value, int) and 15 <= value <= 600:
                    setattr(settings, attribute, value)

    def _primary(self) -> dict[str, Any]:
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

    def _fallback(self) -> dict[str, Any]:
        api_key = self._credentials.get_google_api_key()
        configured = bool(api_key)
        is_primary = settings.primary_provider in ("google_api", "google-api")
        until = self._state.blocked_until("google-api") if self._state else None
        available = configured and until is None
        status: dict[str, Any] = {
            "id": "google-api",
            "label": "Google API",
            "configured": configured,
            "masked_key": self._masked_key(api_key) if api_key else None,
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

    def _next_execution(self) -> dict[str, Any]:
        """현재 스냅샷 기준 다음 AI 작업의 예상 경로. 실행 이력은 만들지 않는다."""
        is_google_primary = settings.primary_provider in ("google_api", "google-api")
        primary = self._fallback() if is_google_primary else self._primary()
        secondary = self._primary() if is_google_primary else self._fallback()

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

    @staticmethod
    def _masked_key(api_key: str) -> str:
        """키 원문을 응답·로그·브라우저 상태로 전달하지 않는 표시 전용 힌트."""
        return f"{api_key[:4]}••••••••{api_key[-4:]}"
