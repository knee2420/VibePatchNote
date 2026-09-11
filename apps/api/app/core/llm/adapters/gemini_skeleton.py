"""Google Generative Language API 직결 어댑터.

CLI 를 거치지 않고 `google-genai` 파이썬 SDK 를 직접 호출하기 위한 자리.
CLI 대비 이점은 프로세스 기동 비용 제거와 스트리밍 제어이고, 대신 인증·쿼터를
호스트가 직접 관리해야 한다.

붙일 때 할 일:

1. `api_key` / ADC 인증 로드
2. `generate_content` 호출 + `response_schema` 로 구조화 강제
3. `usage_metadata` 를 `LlmExecutionResult` 토큰 필드로 매핑
4. 이 프로바이더는 `--effort` 접미사 규칙이 없으므로, 대응하는 `ModelSpec` 은
   `supports_effort_flag=True` 로 등록해야 effort 인자가 살아난다.
"""
from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union

import requests
from scaffold_engine.harness import (
    STATUS_ERROR,
    STATUS_SUCCESS,
    STATUS_TIMEOUT,
    BaseLlmHarness,
    LlmExecutionResult,
)

logger = logging.getLogger(__name__)

# Gemini structured output가 지원하지 않는 JSON Schema 주석/제약이다. Pydantic이
# 생성한 스키마의 `default` 등을 그대로 보내면 모델 호출 전에 400으로 거절될 수 있다.
_UNSUPPORTED_SCHEMA_KEYS = {
    "$schema",
    "const",
    "default",
    "deprecated",
    "examples",
    "maxLength",
    "minLength",
    "pattern",
    "readOnly",
    "writeOnly",
}


def _gemini_schema(value: Any) -> Any:
    if isinstance(value, list):
        return [_gemini_schema(item) for item in value]
    if not isinstance(value, dict):
        return value
    return {
        key: _gemini_schema(item)
        for key, item in value.items()
        if key not in _UNSUPPORTED_SCHEMA_KEYS
    }


class GoogleGenAiHarness(BaseLlmHarness):
    """API key를 이용하는 Google Generative Language REST 어댑터.

    SDK 의존성을 추가하지 않아도 되도록 기존 `requests`로 구현한다. 키는 절대 로그나
    결과 텔레메트리에 기록하지 않는다.
    """

    name = "google-genai"

    def __init__(
        self,
        model: str = "gemini-3.8-flash-low",
        api_key: Optional[str] = None,
        timeout_seconds: int = 180,
    ) -> None:
        super().__init__(model=model, timeout_seconds=timeout_seconds)
        self.api_key = api_key

    def run_structured(
        self,
        prompt: str,
        *,
        schema_path: Optional[Union[str, Path]] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> LlmExecutionResult:
        target_model = model or self.model
        if not self.api_key:
            return LlmExecutionResult(
                status=STATUS_ERROR,
                model=target_model,
                error="Google API key is not configured.",
                telemetry_metadata={"provider": "google_api", "failure_code": "FALLBACK_NOT_CONFIGURED"},
            )

        resolved_schema = json_schema
        if resolved_schema is None and schema_path is not None:
            try:
                resolved_schema = json.loads(Path(schema_path).read_text(encoding="utf-8"))
            except (OSError, ValueError, TypeError) as exc:
                return LlmExecutionResult(
                    status=STATUS_ERROR,
                    model=target_model,
                    error=f"Google API output schema could not be loaded: {exc}",
                    telemetry_metadata={
                        "provider": "google_api",
                        "failure_code": "OUTPUT_SCHEMA_INVALID",
                    },
                )

        generation_config: Dict[str, Any] = {"responseMimeType": "application/json"}
        if resolved_schema:
            generation_config["responseJsonSchema"] = _gemini_schema(resolved_schema)
        request_body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": generation_config,
        }
        started = time.monotonic()
        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent",
                params={"key": self.api_key},
                json=request_body,
                timeout=timeout or self.timeout_seconds,
            )
        except requests.Timeout:
            return LlmExecutionResult(status=STATUS_TIMEOUT, model=target_model, error="Google API request timed out.", telemetry_metadata={"provider": "google_api", "failure_code": "PROVIDER_TIMEOUT"})
        except requests.RequestException as exc:
            return LlmExecutionResult(status=STATUS_ERROR, model=target_model, error=f"Google API network error: {exc}", telemetry_metadata={"provider": "google_api", "failure_code": "PROVIDER_UNAVAILABLE"})

        duration = round(time.monotonic() - started, 3)
        if not response.ok:
            try:
                message = response.json().get("error", {}).get("message", response.text)
            except ValueError:
                message = response.text
            return LlmExecutionResult(status=STATUS_ERROR, model=target_model, duration_seconds=duration, error=f"Google API error ({response.status_code}): {message}", telemetry_metadata={"provider": "google_api", "http_status": response.status_code})

        payload = response.json()
        candidates = payload.get("candidates") or []
        parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
        text = "".join(str(part.get("text", "")) for part in parts)
        try:
            structured_output = json.loads(text) if resolved_schema and text else None
        except json.JSONDecodeError:
            structured_output = None
        usage = payload.get("usageMetadata") or {}
        return LlmExecutionResult(
            status=STATUS_SUCCESS,
            model=target_model,
            structured_output=structured_output,
            raw_response=text,
            duration_seconds=duration,
            input_tokens=usage.get("promptTokenCount", 0),
            output_tokens=usage.get("candidatesTokenCount", 0),
            total_tokens=usage.get("totalTokenCount", 0),
            telemetry_metadata={"provider": "google_api", "fallback_used": False},
        )
