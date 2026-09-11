"""보조 API 키로 쓸 수 있는 모델과 Google 프로젝트 한도를 한 표로 합친다.

두 출처가 아는 것이 다르다.

- API 키의 모델 목록: 지금 이 키로 generateContent 를 부를 수 있는 모델
- 프로젝트 한도(Cloud Quotas): 종료·실험·내부용까지 모든 모델의 tier 별 한도

표에는 API 키의 모델 목록이 반환한 현재 generateContent 모델을 남긴다. RPM·TPM·RPD는
각기 독립된 한도라 RPD가 없다는 이유만으로 모델이 종료됐다고 판단하지 않는다.
조회 결과는 저장하지 않는다.
"""
from __future__ import annotations

import re
from typing import Any

from ..ports import GoogleModelCatalogPort, GoogleQuotaPort

# 사용 기록이 없을 때의 정렬 순서. 개인 사용 기록이 아니라 일반적인 인지도 기준이다.
POPULAR_MODEL_ORDER = (
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
)

# 키 목록은 `-preview`·출시일·`-it` 을 붙이고(antigravity-preview-05-2026, gemma-4-31b-it)
# 한도 목록은 기본 이름을 쓴다(antigravity, gemma-4-31b). 비교 전에 둘 다 기본 이름으로 맞춘다.
_VARIANT_SUFFIX = re.compile(r"-preview(?=-|$)|-\d{2}-\d{4}$|-it$")


def normalize_model_id(model_id: str) -> str:
    return _VARIANT_SUFFIX.sub("", model_id.lower())


def model_category(model_id: str) -> str:
    """AI Studio 한도 화면의 분류. 표시 문구는 화면이 정한다."""
    if "live" in model_id or "native-audio" in model_id:
        return "live"
    if "tts" in model_id:
        return "speech"
    if "transcribe" in model_id:
        return "transcription"
    if "image" in model_id:
        return "image"
    if model_id.startswith("lyria"):
        return "music"
    if model_id.startswith(("antigravity", "deep-research")) or "computer-use" in model_id:
        return "agent"
    return "text"


class ReadGoogleProjectUsageUseCase:
    """API 키 모델 목록 × 프로젝트 한도 → 제공 중인 모델의 한도 표."""

    def __init__(self, quotas: GoogleQuotaPort, models: GoogleModelCatalogPort) -> None:
        self._quotas = quotas
        self._models = models

    def execute(self) -> dict[str, Any]:
        project = self._quotas.read()
        quotas = {
            normalize_model_id(str(quota.get("model", ""))): quota
            for quota in project.get("quotas", [])
            if isinstance(quota, dict)
        }

        # 같은 한도를 가리키는 모델이 여럿이면(…-flash-lite 와 …-flash-lite-preview) 한 줄만 남긴다.
        chosen: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
        for model in self._models.list_models():
            model_id = str(model.get("id", ""))
            quota = _match_quota(normalize_model_id(model_id), quotas)
            if quota is None:
                quota = {
                    "model": normalize_model_id(model_id),
                    "rpm": None,
                    "tpm": None,
                    "rpd": None,
                    "recentTokens": 0,
                }
            base = str(quota.get("model", ""))
            current = chosen.get(base)
            if current is None or _preference(model_id, base) < _preference(str(current[0].get("id", "")), base):
                chosen[base] = (model, quota)

        ordered = sorted(chosen.items(), key=lambda item: _sort_key(item[0], *item[1]))
        return {
            "projectId": project.get("projectId", ""),
            "checkedAt": project.get("checkedAt", 0),
            "tier": project.get("tier", "free"),
            "billingEnabled": project.get("billingEnabled"),
            "models": [_row(model, quota) for _, (model, quota) in ordered],
        }


def _match_quota(normalized_id: str, quotas: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    if normalized_id in quotas:
        return quotas[normalized_id]
    # 파생 모델(gemma-4-26b-a4b 등)은 기본 모델의 한도를 함께 쓴다. 가장 긴 기본 이름을 고른다.
    bases = [name for name in quotas if normalized_id.startswith(name + "-")]
    return quotas[max(bases, key=len)] if bases else None


def _preference(model_id: str, base: str) -> tuple[int, int]:
    """정확히 같은 이름을 먼저, 없으면 짧은 이름(preview·날짜가 붙지 않은 쪽)을 고른다."""
    return (0 if model_id == base else 1, len(model_id))


def _sort_key(base: str, model: dict[str, Any], quota: dict[str, Any]) -> tuple[int, int, str]:
    popularity = POPULAR_MODEL_ORDER.index(base) if base in POPULAR_MODEL_ORDER else len(POPULAR_MODEL_ORDER)
    return (-int(quota.get("recentTokens") or 0), popularity, str(model.get("label") or model.get("id", "")))


def _row(model: dict[str, Any], quota: dict[str, Any]) -> dict[str, Any]:
    model_id = str(model.get("id", ""))
    return {
        "id": model_id,
        "label": model.get("label") or model_id,
        "category": model_category(normalize_model_id(model_id)),
        "rpm": quota.get("rpm"),
        "tpm": quota.get("tpm"),
        "rpd": quota.get("rpd"),
        "recentTokens": int(quota.get("recentTokens") or 0),
    }
