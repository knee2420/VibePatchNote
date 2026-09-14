"""L1 계약 테스트 골격 — 복사해서 `<대상>` 을 바꾼다.

L1 이 지키는 것: **어휘 · 스키마 · 변환의 무손실성.**
앱을 임포트하지 않는다. 파일을 쓰지 않는다. 등급 예산은 전체 1초다.

판정: "코드를 실행하지 않고 증명되는가?" 아니오 → "앱을 부팅해야 하는가?" 아니오 →
      "포트/파일/외부 경계를 넘는가?" 아니오 → **L1**

정본: workbench/07.test_strategy/spec/02.tiers/02.L1-contracts.md
실제 예: workbench/07.test_strategy/examples/01.L1-usage-vocabulary.md
"""
from __future__ import annotations

# L1 은 계약이 사는 곳에서만 임포트한다. `app.*` 임포트가 보이면 등급이 틀린 것이다.
from agent_telemetry.contracts import SpanUsage, usage_from_product_dict, usage_to_product_dict


def test_the_fact_this_protects() -> None:          # ← 지키려는 사실로 이름을 바꾼다
    """<한 줄: 이 테스트가 지키는 사실>

    <무엇이 실제로 일어났는가 — 증상과, 그 증상이 보이지 않았던 이유>
    <왜 이 방식이어야 하는가 — 대안을 택하지 않은 근거>
    """
    # given — 생산자가 쓰는 어휘 그대로
    produced = SpanUsage(prompt_tokens=10, completion_tokens=5, total_tokens=15)

    # when — 경계를 한 번 넘긴다
    consumed = usage_to_product_dict(produced)

    # then — 넘긴 뒤에도 같은 사실인가
    assert consumed["input_tokens"] == 10
    assert consumed["total_tokens"] == 15


def test_conversion_is_lossless() -> None:
    """왕복시켜도 값이 변하지 않는다.

    한쪽 방향만 검증하면 역방향에서 조용히 0 이 되는 필드를 놓친다.
    실제로 캐시·사고 토큰이 그렇게 사라졌다.

    `reasoning_tokens` 를 명시하는 이유: 이 필드만 `Optional` 이라 미지정(None)과
    0 이 다른 뜻이다. 왕복하면 None 이 0 이 되므로 엄격 비교가 깨진다.
    그 차이 자체를 검증하는 것은 아래 테스트의 일이다.
    """
    original = SpanUsage(prompt_tokens=7, completion_tokens=3, reasoning_tokens=0, total_tokens=10)

    roundtrip = usage_from_product_dict(usage_to_product_dict(original))

    assert roundtrip == original


def test_unknown_is_not_the_same_as_zero() -> None:
    """모르는 값(None)과 0 은 다른 사실이다.

    0 은 "안 썼다"로 읽히고 None 은 "모른다"로 읽힌다. 이 저장소는 비용에서
    같은 구분을 이미 지키고 있다 — `estimated_cost_usd` 는 단가 축이 없는 동안
    0.0 이 아니라 None 이다. 0.0 으로 내보내면 "무료"라는 거짓말이 된다.
    """
    unknown = SpanUsage(prompt_tokens=7, completion_tokens=3, total_tokens=10)

    assert unknown.reasoning_tokens is None
    # 제품 어휘로 넘기면 0 이 된다. 이 변환은 **의도된 손실**이므로 여기에 기록한다.
    assert usage_to_product_dict(unknown)["thinking_tokens"] == 0


# ── 이 등급에서 하지 않는 것 ─────────────────────────────────────────────────
#
# ✗ `from main import app`            → L3 다
# ✗ `tmp_path` 에 파일 쓰기            → L2 다
# ✗ import 그래프 검사                 → L0(import-linter) 다
# ✗ 문서 파일 존재 확인                → 테스트가 아니라 lint 다
