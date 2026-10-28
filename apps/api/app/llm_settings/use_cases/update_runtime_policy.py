"""런타임 실행 정책 갱신 및 파일 복원 유스케이스."""
from __future__ import annotations

from typing import Any, Optional

from llm_driver import MODEL_REGISTRY, PRIMARY_PROVIDER_ID

from app.core.llm import GOOGLE_PROVIDER, RuntimeExecutionPolicy, normalize_provider

from ..ports import CredentialStorePort, RuntimePolicyRepository

#: 타임아웃으로 받아들일 범위. 밖의 값은 저장된 기록이라도 쓰지 않는다.
_MIN_TIMEOUT_SECONDS = 15
_MAX_TIMEOUT_SECONDS = 600


def policy_dict(policy: RuntimeExecutionPolicy) -> dict[str, Any]:
    """현재 실행 정책을 UI 계약 모양으로 옮긴다."""
    is_google_primary = policy.is_google_primary
    return {
        "primaryProvider": "google-api" if is_google_primary else PRIMARY_PROVIDER_ID,
        "primaryModel": policy.primary_model,
        "primaryTimeoutSeconds": policy.primary_timeout_seconds,
        "fallbackProvider": PRIMARY_PROVIDER_ID if is_google_primary else "google-api",
        "fallbackModel": policy.fallback_model,
        "fallbackTimeoutSeconds": policy.fallback_timeout_seconds,
    }


class UpdateRuntimePolicyUseCase:
    """현재 API 프로세스의 실행 정책(모델·타임아웃·공급자)을 갱신하고 파일에 영속화한다."""

    def __init__(
        self,
        credentials: CredentialStorePort,
        policy: RuntimeExecutionPolicy,
        runtime_policy: Optional[RuntimePolicyRepository] = None,
    ) -> None:
        self._credentials = credentials
        # **이 프로세스에서 실행 정책을 바꾸는 유일한 지점이다.** 예전에는 전역
        # `settings` 객체에 직접 대입했다 — 불변이라고 문서에 적힌 객체를
        # 유스케이스가 가변으로 쓴 것이고, 누가 언제 바꿨는지 추적할 수 없었다.
        self._policy = policy
        self._runtime_policy = runtime_policy

    def restore(self) -> None:
        """디스크에 저장된 정책을 이 프로세스의 실행 정책으로 복원한다."""
        if not self._runtime_policy:
            return
        saved = self._runtime_policy.load()
        if not saved:
            return

        for key, attribute in (("primaryProvider", "primary_provider"), ("fallbackProvider", "fallback_provider")):
            provider = normalize_provider(saved.get(key))
            if provider:
                setattr(self._policy, attribute, provider)

        is_google_primary = self._policy.is_google_primary
        model_fields = (
            ("primaryModel", "google_api_model" if is_google_primary else "agent_cli_model"),
            ("fallbackModel", "agent_cli_model" if is_google_primary else "google_api_model"),
        )
        for key, attribute in model_fields:
            value = saved.get(key)
            if isinstance(value, str) and value:
                # CLI 모델만 레지스트리로 검증한다. Google 쪽은 공급자가 모델을
                # 늘리므로 우리 레지스트리에 없다고 거절하면 쓸 수 없는 모델이 생긴다.
                if attribute == "agent_cli_model" and value not in MODEL_REGISTRY:
                    continue
                setattr(self._policy, attribute, value)

        timeout_fields = (
            ("primaryTimeoutSeconds", "google_api_timeout_seconds" if is_google_primary else "agent_cli_timeout_seconds"),
            ("fallbackTimeoutSeconds", "agent_cli_timeout_seconds" if is_google_primary else "google_api_timeout_seconds"),
        )
        for key, attribute in timeout_fields:
            value = saved.get(key)
            if isinstance(value, int) and _MIN_TIMEOUT_SECONDS <= value <= _MAX_TIMEOUT_SECONDS:
                setattr(self._policy, attribute, value)

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
        requested_primary = normalize_provider(primary_provider)
        if requested_primary == GOOGLE_PROVIDER and not self._credentials.get_google_api_key():
            raise ValueError("Google API를 기본 실행 엔진으로 지정하려면 먼저 Google API 키를 등록해야 합니다.")
        if requested_primary:
            self._policy.primary_provider = requested_primary

        requested_fallback = normalize_provider(fallback_provider)
        if requested_fallback:
            self._policy.fallback_provider = requested_fallback

        if self._policy.is_google_primary:
            self._policy.google_api_model = primary_model
            self._policy.google_api_timeout_seconds = primary_timeout_seconds
            self._policy.agent_cli_model = fallback_model
            self._policy.agent_cli_timeout_seconds = fallback_timeout_seconds
        else:
            if primary_model not in MODEL_REGISTRY:
                raise ValueError(f"Unknown primary model: {primary_model}")
            self._policy.agent_cli_model = primary_model
            self._policy.agent_cli_timeout_seconds = primary_timeout_seconds
            self._policy.google_api_model = fallback_model
            self._policy.google_api_timeout_seconds = fallback_timeout_seconds

        policy = policy_dict(self._policy)
        if self._runtime_policy:
            self._runtime_policy.save(policy)
        return policy
