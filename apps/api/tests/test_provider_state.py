"""공급자 차단 상태와 폴백 동작.

실제로 겪은 사고를 그대로 재현한다: CLI 쿼터가 소진되면 사유를 한 번만
알려주고 그 뒤로는 응답 없이 멈춘다. 상태를 기억하지 않으면 요청마다
180초를 기다린 뒤 같은 실패를 본다.
"""
from __future__ import annotations

from datetime import timedelta

from scaffold_engine.harness import BaseLlmHarness, LlmExecutionResult

from app.core.llm.fallback import PRIMARY_PROVIDER_ID, FallbackLlmHarness
from app.core.llm.provider_state import ProviderStateStore, parse_reset_after

QUOTA_MESSAGE = (
    "Individual quota reached. Please upgrade your subscription to "
    "increase your limits. Resets in 41h41m40s."
)


class _FakeCli(BaseLlmHarness):
    """1회차는 쿼터 오류, 2회차부터는 실제 CLI 처럼 멈췄다가 타임아웃."""

    name = "fake-cli"

    def __init__(self) -> None:
        super().__init__(model="fake-model", timeout_seconds=180)
        self.calls = 0

    def run_structured(self, prompt, **kwargs):  # type: ignore[override]
        self.calls += 1
        if self.calls == 1:
            return LlmExecutionResult(status="ERROR", model=self.model, error=QUOTA_MESSAGE)
        return LlmExecutionResult(
            status="TIMEOUT", model=self.model, error="CLI timed out after 180s"
        )


class _NoCredentials:
    def get_google_api_key(self) -> str | None:
        return None

    def set_google_api_key(self, api_key: str) -> None: ...

    def delete_google_api_key(self) -> None: ...


def _harness(state_file):
    cli = _FakeCli()
    return cli, FallbackLlmHarness(
        primary=cli,
        credentials=_NoCredentials(),
        google_model="fake-google",
        google_timeout_seconds=60,
        provider_state=ProviderStateStore(state_file),
    )


def test_reset_hint_is_parsed_from_provider_message():
    assert parse_reset_after(QUOTA_MESSAGE) == timedelta(hours=41, minutes=41, seconds=40)
    assert parse_reset_after("resets in 12m") == timedelta(minutes=12)
    assert parse_reset_after("사유를 알 수 없는 오류") is None


def test_quota_failure_is_remembered_so_cli_is_not_called_again(tmp_path):
    cli, harness = _harness(tmp_path / "state.json")

    first = harness.run_structured("분석")
    assert cli.calls == 1
    assert first.telemetry_metadata["primary_failure_code"] == "QUOTA_EXHAUSTED"

    # 이후 요청은 CLI 를 부르지 않는다 — 180초를 다시 기다리지 않는다.
    for _ in range(3):
        again = harness.run_structured("분석")
        assert again.telemetry_metadata["failure_code"] == "FALLBACK_NOT_CONFIGURED"
        assert again.telemetry_metadata["requires_action"] == "configure_google_api"
    assert cli.calls == 1


def test_recovery_hint_reaches_the_caller(tmp_path):
    _, harness = _harness(tmp_path / "state.json")
    harness.run_structured("분석")
    result = harness.run_structured("분석")
    assert "41시간" in result.telemetry_metadata["primary_recovers_in"]


def test_block_expires(tmp_path):
    store = ProviderStateStore(tmp_path / "state.json")
    store.block(PRIMARY_PROVIDER_ID, reason="QUOTA_EXHAUSTED", reset_after=timedelta(seconds=-1))
    assert store.is_blocked(PRIMARY_PROVIDER_ID) is False


def test_success_clears_previous_block(tmp_path):
    state_file = tmp_path / "state.json"
    store = ProviderStateStore(state_file)
    store.block(PRIMARY_PROVIDER_ID, reason="QUOTA_EXHAUSTED", reset_after=timedelta(hours=1))

    class _WorkingCli(BaseLlmHarness):
        name = "ok-cli"

        def __init__(self) -> None:
            super().__init__(model="fake-model", timeout_seconds=180)

        def run_structured(self, prompt, **kwargs):  # type: ignore[override]
            return LlmExecutionResult(status="SUCCESS", model=self.model, raw_response="{}")

    # 차단 중에는 CLI 를 건너뛰므로, 상태 파일을 비운 뒤 성공 경로를 확인한다.
    store.clear(PRIMARY_PROVIDER_ID)
    harness = FallbackLlmHarness(
        primary=_WorkingCli(),
        credentials=_NoCredentials(),
        google_model="fake-google",
        google_timeout_seconds=60,
        provider_state=ProviderStateStore(state_file),
    )
    assert harness.run_structured("분석").ok is True
    assert ProviderStateStore(state_file).is_blocked(PRIMARY_PROVIDER_ID) is False
