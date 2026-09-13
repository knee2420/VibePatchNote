"""outline 분석 실패를 UI 계약으로 매핑하는 헬퍼."""
from __future__ import annotations

from typing import Any

from agent_runtime import DEFAULT_RETRY_POLICY

CONFIGURE_GOOGLE_API = "configure_google_api"


def failure_code_of(telemetry: dict[str, Any]) -> str:
    """텔레메트리에서 실패 코드를 꺼낸다. 없으면 일반 실패."""
    metadata = telemetry.get("telemetry_metadata") or {}
    return (
        metadata.get("failure_code")
        or metadata.get("primary_failure_code")
        or "ANALYSIS_FAILED"
    )


def analysis_error(telemetry: dict[str, Any]) -> dict[str, Any]:
    """공급자 내부 오류를 UI 계약으로 바꾼다."""
    metadata = telemetry.get("telemetry_metadata") or {}
    code = failure_code_of(telemetry)
    recovers_in = metadata.get("primary_recovers_in")
    when = f" 한도는 {recovers_in} 회복됩니다." if recovers_in else ""
    retryable = DEFAULT_RETRY_POLICY.is_retryable(code)

    if code == "FALLBACK_NOT_CONFIGURED":
        primary_code = metadata.get("primary_failure_code")
        cause = (
            "AI 사용량 한도가 소진되었습니다"
            if primary_code == "QUOTA_EXHAUSTED"
            else "기본 AI 경로를 사용할 수 없습니다"
        )
        return {
            "code": code,
            "message": f"{cause}.{when} Google API를 설정하면 지금 이어서 분석할 수 있습니다.",
            "retryable": False,
            "requiresAction": CONFIGURE_GOOGLE_API,
        }
    if code == "QUOTA_EXHAUSTED":
        return {
            "code": code,
            "message": f"AI 사용량 한도가 소진되었습니다.{when} Google API를 설정하면 지금 이어서 분석할 수 있습니다.",
            "retryable": False,
            "requiresAction": CONFIGURE_GOOGLE_API,
        }
    if code == "AUTH_EXPIRED":
        return {
            "code": code,
            "message": "AI 공급자 인증이 만료되었습니다. CLI 로그인을 갱신하거나 Google API를 설정해 주세요.",
            "retryable": False,
            "requiresAction": CONFIGURE_GOOGLE_API,
        }
    if retryable:
        return {
            "code": code,
            "message": "AI 제공자에 일시적으로 연결할 수 없습니다. 다시 시도해 주세요.",
            "retryable": True,
        }
    return {
        "code": code,
        "message": "문서 AI 분석을 완료하지 못했습니다. 실행 기록을 확인해 주세요.",
        "retryable": False,
    }
