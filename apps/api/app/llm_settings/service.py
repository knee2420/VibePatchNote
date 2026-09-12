from __future__ import annotations

import shutil  # noqa: F401 - re-exported for test backward compatibility
from typing import Any, Optional

from scaffold_engine.harness import MODEL_REGISTRY

from app.core.config import settings

from .ports import (
    AgyStatusLineSettings,
    AgyStatusSnapshotPort,
    AgyUsagePort,
    CliAvailabilityPort,
    CredentialStorePort,
    GoogleModelCatalogPort,
    GoogleQuotaPort,
    ProviderStatePort,
    RuntimePolicyRepository,
)
from .use_cases import (
    ReadGoogleProjectUsageUseCase,
    ResolveNextExecutionUseCase,
    UpdateRuntimePolicyUseCase,
    get_current_policy_dict,
    mask_key,
)


class LlmSettingsService:
    def __init__(
        self,
        credentials: CredentialStorePort,
        provider_state: Optional[ProviderStatePort] = None,
        agy_status: Optional[AgyStatusSnapshotPort] = None,
        runtime_policy: Optional[RuntimePolicyRepository] = None,
        agy_status_line: Optional[AgyStatusLineSettings] = None,
        agy_usage: Optional[AgyUsagePort] = None,
        google_models: Optional[GoogleModelCatalogPort] = None,
        google_quotas: Optional[GoogleQuotaPort] = None,
        google_usage: Optional[ReadGoogleProjectUsageUseCase] = None,
        cli_availability: Optional[CliAvailabilityPort] = None,
        resolve_next_execution: Optional[ResolveNextExecutionUseCase] = None,
        update_policy_uc: Optional[UpdateRuntimePolicyUseCase] = None,
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
        self._resolve_next_execution = resolve_next_execution or ResolveNextExecutionUseCase(
            credentials=credentials,
            provider_state=provider_state,
            cli_availability=cli_availability,
        )
        self._update_policy_uc = update_policy_uc or UpdateRuntimePolicyUseCase(
            credentials=credentials,
            runtime_policy=runtime_policy,
        )
        self._update_policy_uc.restore()

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
        return {
            "providers": [self._primary(), self._fallback()],
            "models": models,
            "policy": get_current_policy_dict(),
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
        return self._update_policy_uc.execute(
            primary_model=primary_model,
            primary_timeout_seconds=primary_timeout_seconds,
            fallback_model=fallback_model,
            fallback_timeout_seconds=fallback_timeout_seconds,
            primary_provider=primary_provider,
            fallback_provider=fallback_provider,
        )

    def remove_google_api(self) -> None:
        self._credentials.delete_google_api_key()

    # --- 내부 (유스케이스 위임) ----------------------------------------

    def _primary(self) -> dict[str, Any]:
        return self._resolve_next_execution.primary_provider_status()

    def _fallback(self) -> dict[str, Any]:
        return self._resolve_next_execution.fallback_provider_status()

    def _next_execution(self) -> dict[str, Any]:
        return self._resolve_next_execution.execute()

    @staticmethod
    def _masked_key(api_key: str) -> str:
        return mask_key(api_key)
