"""API key가 실제로 접근 가능한 Gemini 모델만 읽는 어댑터."""
from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from app.core.llm.credentials import CredentialStore


class GoogleModelCatalog:
    _ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, credentials: CredentialStore) -> None:
        self._credentials = credentials

    def list_models(self) -> list[dict[str, object]]:
        api_key = self._credentials.get_google_api_key()
        if not api_key:
            raise RuntimeError("Google API 키를 먼저 저장해 주세요.")
        try:
            with urlopen(f"{self._ENDPOINT}?{urlencode({'key': api_key})}", timeout=15) as response:
                payload: dict[str, Any] = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            raise RuntimeError("Google API에서 모델 목록을 읽지 못했습니다. API 키와 네트워크를 확인해 주세요.") from exc
        models = payload.get("models")
        if not isinstance(models, list):
            raise RuntimeError("Google API 모델 목록 응답이 올바르지 않습니다.")
        return [
            {
                "id": str(model.get("name", "")).removeprefix("models/"),
                "label": model.get("displayName") or str(model.get("name", "")).removeprefix("models/"),
                "inputTokenLimit": model.get("inputTokenLimit"),
                "outputTokenLimit": model.get("outputTokenLimit"),
                "supportsGenerateContent": "generateContent" in (model.get("supportedGenerationMethods") or []),
            }
            for model in models
            if isinstance(model, dict) and "generateContent" in (model.get("supportedGenerationMethods") or [])
        ]
