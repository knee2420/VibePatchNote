"""
[02.reconstruct] Stage B — 블록 역할 분류 및 검증기 (BlockClassifier).
LLM을 호출하여 블록의 역할과 슬롯 라벨을 판정하고,
원문 실측 기하와 대조하여 환각(미지의 id, 원문 불일치 텍스트)을 완전히 필터링합니다.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from harness.llm_client import ReconstructLlmClient
from prompts.classification_prompt import build_classification_prompt
from schemas.geometry import PageGeometry
from schemas.models import ROLES

logger = logging.getLogger(__name__)

FALLBACK_ROLE = "label"


class BlockClassifier:
    """Stage B 분류기."""

    def __init__(self, client: Optional[ReconstructLlmClient] = None) -> None:
        self.client = client or ReconstructLlmClient()

    def classify(self, doc_name: str, page: "PageGeometry", doc_id: str = "") -> Dict[str, Any]:
        blocks = page.classifiable()
        if not blocks:
            return {"doc_title": doc_name, "blocks": []}

        prompt = build_classification_prompt(doc_name, page)
        raw_payload = self.client.classify_blocks(prompt, page_no=page.page, doc_id=doc_id)

        if not raw_payload:
            logger.warning("[classifier] LLM 응답 부재 — 결정적 룰 폴백 적용 (p%d)", page.page)
            raw_payload = self._rule_based_fallback(blocks, doc_name)

        return self._sanitize(raw_payload, blocks, doc_name, page.page)

    def _rule_based_fallback(self, blocks: List[Any], doc_name: str) -> Dict[str, Any]:
        """LLM 호출 불가 시 컴포넌트 실측 기반 안전한 룰 폴백."""
        decisions = []
        for b in blocks:
            # 표 셀(cell)의 경우 col > 0 이면 value 가능성 높음
            if b.kind == "cell":
                if b.col is not None and b.col > 0:
                    decisions.append({
                        "id": b.id,
                        "role": "value",
                        "value_text": b.text,
                        "slot_label": b.text[:20] if b.text else "입력 항목",
                    })
                else:
                    decisions.append({
                        "id": b.id,
                        "role": "label",
                        "value_text": "",
                        "slot_label": "",
                    })
            elif b.kind == "image":
                decisions.append({
                    "id": b.id,
                    "role": "value",
                    "value_text": "",
                    "slot_label": "회사 로고",
                })
            else:
                # 텍스트 라인
                decisions.append({
                    "id": b.id,
                    "role": "label",
                    "value_text": "",
                    "slot_label": "",
                })
        return {"doc_title": doc_name, "blocks": decisions}

    @staticmethod
    def _sanitize(
        payload: Dict[str, Any],
        blocks: List[Any],
        source_name: str,
        page_no: int,
    ) -> Dict[str, Any]:
        """모델 출력을 실측 사실과 엄격히 대조하여 정제."""
        text_by_id = {b.id: b.text for b in blocks}
        raw_blocks = payload.get("blocks", [])

        cleaned: List[Dict[str, Any]] = []
        seen_ids = set()

        for item in raw_blocks:
            if not isinstance(item, dict):
                continue
            bid = item.get("id")
            if not bid or bid not in text_by_id or bid in seen_ids:
                continue

            seen_ids.add(bid)
            role = item.get("role")
            if role not in ROLES:
                role = FALLBACK_ROLE

            value_text = (item.get("value_text") or "").strip()
            slot_label = (item.get("slot_label") or "").strip()
            source_text = text_by_id[bid]

            # 원문에 없는 value_text는 환각으로 보고 블록 전체를 슬롯화하거나 폴백
            if value_text and source_text.strip() and value_text not in source_text:
                logger.warning("[classifier] value_text 불일치로 정제 (%s): %r", bid, value_text[:30])
                value_text = ""
                if role == "mixed":
                    role = "value"

            cleaned.append({
                "id": bid,
                "role": role,
                "value_text": value_text,
                "slot_label": slot_label or (source_text[:20] if role in ("value", "mixed") else ""),
            })

        # 누락된 블록은 안전하게 label(고정 텍스트)로 채움
        missing_ids = set(text_by_id) - seen_ids
        for mid in missing_ids:
            cleaned.append({
                "id": mid,
                "role": FALLBACK_ROLE,
                "value_text": "",
                "slot_label": "",
            })

        return {
            "doc_title": payload.get("doc_title") or source_name,
            "blocks": cleaned,
        }
