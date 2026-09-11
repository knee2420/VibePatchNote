from app.llm_settings.adapters.google_quota_reader import summarize_tier_limits
from app.llm_settings.use_cases import ReadGoogleProjectUsageUseCase
from app.llm_settings.use_cases.read_google_project_usage import normalize_model_id


def _quota_info(metric: str, interval: str, model: str, value: str | None) -> dict:
    details = {} if value is None else {"value": value}
    return {
        "metric": f"generativelanguage.googleapis.com/{metric}",
        "refreshInterval": interval,
        "dimensionsInfos": [{"dimensions": {"model": model}, "details": details}],
    }


def test_free_tier_limits_are_not_filled_from_paid_tiers():
    infos = [
        _quota_info("generate_content_free_tier_requests", "minute", "gemini-3.5-flash", "5"),
        _quota_info("generate_content_free_tier_requests", "day", "gemini-3.5-flash", "20"),
        _quota_info("generate_content_free_tier_input_token_count", "minute", "gemini-3.5-flash", "250000"),
        _quota_info("generate_requests_per_model_per_day", "day", "gemini-3.5-flash", "10000"),
        # 무료 tier 에서 빠진 모델은 무료 칸이 비어 있고 유료 칸에만 값이 있다.
        _quota_info("generate_content_free_tier_requests", "day", "gemini-3.1-pro", None),
        _quota_info("generate_requests_per_model_per_day", "day", "gemini-3.1-pro", "1000"),
    ]

    free = summarize_tier_limits(infos, "free")
    paid = summarize_tier_limits(infos, "paid_tier_1")

    assert free["gemini-3.5-flash"] == {"rpm": 5, "tpm": 250000, "rpd": 20}
    assert free["gemini-3.1-pro"]["rpd"] is None
    assert paid["gemini-3.1-pro"]["rpd"] == 1000


def test_model_ids_are_compared_by_their_base_name():
    assert normalize_model_id("antigravity-preview-05-2026") == "antigravity"
    assert normalize_model_id("gemma-4-31b-it") == "gemma-4-31b"
    assert normalize_model_id("gemini-3.5-flash-preview-image") == "gemini-3.5-flash-image"
    assert normalize_model_id("gemini-3.1-flash-lite") == "gemini-3.1-flash-lite"


class _Quotas:
    def read(self):
        return {
            "projectId": "demo",
            "checkedAt": 1,
            "tier": "free",
            "billingEnabled": False,
            "quotas": [
                {"model": "gemini-3.5-flash", "rpm": 5, "tpm": 250000, "rpd": 20, "recentTokens": 0},
                {"model": "gemini-3.1-pro", "rpm": None, "tpm": None, "rpd": None, "recentTokens": 0},
                {"model": "gemini-3.1-flash-lite", "rpm": 15, "tpm": 250000, "rpd": 500, "recentTokens": 0},
                {"model": "antigravity", "rpm": 60, "tpm": 100000, "rpd": 100, "recentTokens": 0},
                {"model": "gemma-4-26b", "rpm": 30, "tpm": 16000, "rpd": 14400, "recentTokens": 0},
                {"model": "gemini-2.0-flash-exp", "rpm": 10, "tpm": 250000, "rpd": 0, "recentTokens": 0},
                {"model": "veo-3-generate", "rpm": 2, "tpm": None, "rpd": 10, "recentTokens": 0},
            ],
        }


class _Catalog:
    def list_models(self):
        return [
            {"id": "gemini-3.1-pro", "label": "Gemini 3.1 Pro"},
            {"id": "gemini-2.0-flash-exp", "label": "Gemini 2.0 Flash Exp"},
            {"id": "antigravity-preview-05-2026", "label": "Antigravity Agent Preview"},
            {"id": "gemma-4-26b-a4b-it", "label": "Gemma 4 26B A4B IT"},
            {"id": "gemini-3.1-flash-lite-preview", "label": "Gemini 3.1 Flash Lite Preview"},
            {"id": "gemini-3.1-flash-lite", "label": "Gemini 3.1 Flash Lite"},
            {"id": "gemini-3.5-flash", "label": "Gemini 3.5 Flash"},
        ]


def test_catalog_models_are_kept_even_when_rpd_is_missing_or_zero():
    usage = ReadGoogleProjectUsageUseCase(quotas=_Quotas(), models=_Catalog()).execute()
    rows = usage["models"]

    # 모델 카탈로그가 현재 사용 가능 여부의 정본이다. RPD 하나만으로 종료를 추측하지 않는다.
    assert [row["id"] for row in rows] == [
        "gemini-3.5-flash",
        "gemini-3.1-pro",
        "gemini-3.1-flash-lite",
        "antigravity-preview-05-2026",
        "gemini-2.0-flash-exp",
        "gemma-4-26b-a4b-it",
    ]
    antigravity = rows[3]
    assert antigravity["category"] == "agent"
    assert (antigravity["rpm"], antigravity["tpm"], antigravity["rpd"]) == (60, 100000, 100)
    assert usage["tier"] == "free"
    assert usage["billingEnabled"] is False
