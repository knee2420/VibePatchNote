"""런타임 실행 정책 갱신 및 파일 복원 유스케이스."""
from __future__ import annotations

from typing import Any, Optional

from scaffold_engine.harness import MODEL_REGISTRY

from app.core.config import settings
from app.core.llm.fallback import PRIMARY_PROVIDER_ID

from ..ports import CredentialStorePort, RuntimePolicyRepository


def get_current_policy_dict() -> dict[str, Any]:
    """현재 settings 기준 활성화된 정책 딕셔너리."""
    is_google_primary = settings.primary_provider in ("google_api", "google-api")
    primary_provider_id = "google-api" if is_google_primary else PRIMARY_PROVIDER_ID
    fallback_provider_id = PRIMARY_PROVIDER_ID if is_google_primary else "google-api"
    primary_model = settings.google_api_model if is_google_primary else settings.agent_cli_model
    primary_timeout = settings.google_api_timeout_seconds if is_google_primary else settings.agent_cli_timeout_seconds
    fallback_model = settings.agent_cli_model if is_google_primary else settings.google_api_model
    fallback_timeout = settings.agent_cli_timeout_seconds if is_google_primary else settings.google_api_timeout_seconds

    return {
        "primaryProvider": primary_provider_id,
        "primaryModel": primary_model,
        "primaryTimeoutSeconds": primary_timeout,
        "fallbackProvider": fallback_provider_id,
        "fallbackModel": fallback_model,
        "fallbackTimeoutSeconds": fallback_timeout,
    }


class UpdateRuntimePolicyUseCase:
    """현재 API 프로세스의 실행 정책(모델·타임아웃·공급자)을 갱신하고 파일에 영속화한다."""

    def __init__(
        self,
        credentials: CredentialStorePort,
        runtime_policy: Optional[RuntimePolicyRepository] = None,
    ) -> None:
        self._credentials = credentials
        self._runtime_policy = runtime_policy

    def restore(self) -> None:
        """디스크에 저장된 정책을 로드하여 settings 에 복원한다."""
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

    def execute(
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

        policy = get_current_policy_dict()
        if self._runtime_policy:
            self._runtime_policy.save(policy)
        return policy
