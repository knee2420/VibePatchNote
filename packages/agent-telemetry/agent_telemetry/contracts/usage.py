from typing import Optional
from pydantic import BaseModel, Field, model_validator


class SpanUsage(BaseModel):
    """토큰 소모량 및 소요 시간 집계.

    필드명은 **공급자 응답의 원어**를 따른다(`prompt_tokens` / `completion_tokens`).
    제품·정산 경계에서 쓰는 어휘(`input_tokens` / `output_tokens`)와는 다르며,
    두 어휘 사이의 변환은 `agent_telemetry.contracts.usage` 의 함수 한 쌍만
    수행한다. 호출부가 `dict.get("input_tokens")` 처럼 남의 어휘를 추측하면
    호출부 수만큼 틀릴 기회가 생긴다.

    정본: `.agents/rules/60-data/observability.md` §3-2
    """

    prompt_tokens: int = Field(0, description="입력 프롬프트 토큰 수")
    completion_tokens: int = Field(0, description="출력 생성 토큰 수")
    reasoning_tokens: Optional[int] = Field(None, description="사고/추론 토큰 수")
    # 변환이 무손실이려면 제품 어휘(RunCost)의 모든 축이 여기에도 있어야 한다.
    # 없으면 캐시 토큰이 변환 과정에서 조용히 사라진다.
    cache_read_tokens: int = Field(0, description="프롬프트 캐시로 재사용된 토큰 수")
    total_tokens: int = Field(0, description="총 토큰 수")
    latency_ms: float = Field(0.0, description="소요 시간 (밀리초)")
    # 모르는 값을 0 으로 쓰지 않는다. 0 은 "무료"로 읽힌다.
    # 단가 축(ModelSpec)이 생기기 전까지 이 값은 None 이다.
    estimated_cost_usd: Optional[float] = Field(None, description="예상 비용 (달러). 모르면 None")

    @model_validator(mode="after")
    def _derive_total(self) -> "SpanUsage":
        """`total_tokens` 는 파생값이다. 공급자가 안 주면 구성요소에서 만든다.

        일부 공급자는 합계를 돌려주지 않는다. 그대로 두면 `total_tokens: 0` 인데
        `prompt_tokens: 4798` 인 레코드가 저장되고, 화면에는 "토큰 0"이 뜬다 —
        실제로 저장된 run 에서 그랬다.

        이것은 읽기 시점 스키마 승격(`60-data/rule.md` §5 금지 대상)이 아니다.
        필드명이나 형식을 바꾸는 게 아니라, **정의상 합계인 값**을 그 정의대로
        채우는 것뿐이다. 공급자가 합계를 줬다면 그 값을 존중한다.
        """
        if self.total_tokens == 0:
            parts = self.prompt_tokens + self.completion_tokens + (self.reasoning_tokens or 0)
            if parts > 0:
                self.total_tokens = parts
        return self


#: 제품·정산 경계의 어휘 ↔ 공급자·텔레메트리 경계의 어휘.
#: 이 표가 두 어휘 사이의 유일한 진실이다.
_PRODUCT_TO_PROVIDER = {
    "input_tokens": "prompt_tokens",
    "output_tokens": "completion_tokens",
    "thinking_tokens": "reasoning_tokens",
    "cache_read_tokens": "cache_read_tokens",
    "total_tokens": "total_tokens",
}


def usage_to_product_dict(usage: SpanUsage) -> dict[str, int]:
    """`SpanUsage` 를 제품 어휘(`RunCost` 필드명) 딕셔너리로 변환한다.

    `RunCost` 는 `apps/api` 에 있고 이 패키지는 호스트를 모르므로
    (`60-data/rule.md` §4-5), 타입이 아니라 딕셔너리를 돌려준다.
    호출부가 `RunCost(**usage_to_product_dict(u))` 로 조립한다.
    """
    out: dict[str, int] = {}
    for product_key, provider_key in _PRODUCT_TO_PROVIDER.items():
        value = getattr(usage, provider_key)
        # reasoning_tokens 만 Optional 이다. 제품 어휘에서는 0 이 기본이다.
        out[product_key] = int(value or 0)
    return out


def usage_from_product_dict(payload: dict[str, object]) -> SpanUsage:
    """제품 어휘 딕셔너리를 `SpanUsage` 로 되돌린다.

    `usage_to_product_dict` 의 역함수다. 두 함수의 왕복이 무손실임을
    `test_observability_contract.py::test_usage_conversion_is_lossless` 가 고정한다.
    """
    kwargs: dict[str, object] = {}
    for product_key, provider_key in _PRODUCT_TO_PROVIDER.items():
        if product_key in payload:
            kwargs[provider_key] = int(payload[product_key] or 0)
    return SpanUsage(**kwargs)
