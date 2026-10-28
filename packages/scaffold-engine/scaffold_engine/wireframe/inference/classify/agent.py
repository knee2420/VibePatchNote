"""Stage B — 블록 역할 판정 (Wireframe 트랙).

에이전트는 실측된 블록 id 를 고르고 역할만 답한다. 좌표는 만들지 않는다.
판정 결과는 신뢰하기 전에 반드시 검증한다 (미지의 id 제거, value_text 실재 확인).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from scaffold_engine.contracts import LlmHarness
from scaffold_engine.utils.parsing import parse_json_payload, unknown_ids

from .prompt import build_classification_prompt
from .schema import BLOCK_CLASSIFICATION_SCHEMA, SHAPE_REMINDER

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.tools import PageGeometry

logger = logging.getLogger(__name__)

FALLBACK_ROLE = "label"


class SlotClassifier:
    """`core.interfaces.BlockClassifier` 구현체."""

    def __init__(self, harness: LlmHarness) -> None:
        self.harness = harness
        self.last_result: Optional[Any] = None
        self.last_prompt: str = ""

    def classify(
        self,
        source_name: str,
        page: "PageGeometry",
        image_path: Optional[Any] = None,
        hint_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """실패해도 예외를 던지지 않는다 — 빈 판정을 돌려주면 전부 고정 텍스트가 된다."""
        blocks = page.classifiable()
        if not blocks:
            return {"doc_title": source_name, "blocks": []}

        prompt = build_classification_prompt(source_name, page, hint_text=hint_text)
        self.last_prompt = prompt
        if hasattr(self.harness, "run_structured"):
            res = self.harness.run_structured(
                prompt,
                json_schema=BLOCK_CLASSIFICATION_SCHEMA,
                file_path=image_path,
            )
            self.last_result = res
            payload = res.structured_output
            if not payload and res.raw_response:
                payload = parse_json_payload(res.raw_response, list_key="blocks")
        else:
            payload = self.harness.run_json(
                prompt,
                schema=BLOCK_CLASSIFICATION_SCHEMA,
                retry_hint=SHAPE_REMINDER,
            )
            self.last_result = getattr(self.harness, "last_result", None)

        if not payload:
            logger.warning("[classify] 판정 실패 — 전체를 고정 텍스트로 처리: %s p%d",
                           source_name, page.page)
            return {"doc_title": source_name, "blocks": []}

        return self._sanitize(payload, blocks, source_name, page.page)

    # --- 내부 ---

    @staticmethod
    def _sanitize(
        payload: Dict[str, Any],
        blocks: List[Any],
        source_name: str,
        page_no: int,
    ) -> Dict[str, Any]:
        """모델 출력을 실측 사실과 대조해 걸러낸다."""
        text_by_id = {b.id: b.text for b in blocks}
        id_alias_map: Dict[str, str] = {}
        for b in blocks:
            id_alias_map[b.id] = b.id
            if b.id.startswith("t"):
                id_alias_map[b.id[1:]] = b.id
            elif "-" in b.id:
                id_alias_map[f"t{b.id}"] = b.id

        ghosts = [i.get("id") for i in payload.get("blocks", []) if isinstance(i, dict) and i.get("id") not in id_alias_map]
        if ghosts:
            logger.warning("[classify] 미지의 id %d개 제거 (p%d): %s",
                           len(ghosts), page_no, ghosts[:5])

        cleaned: List[Dict[str, Any]] = []
        for item in payload.get("blocks", []):
            if not isinstance(item, dict):
                continue
            raw_bid = item.get("id")
            bid = id_alias_map.get(raw_bid)
            if not bid or bid not in text_by_id:
                continue
            role = item.get("role") or FALLBACK_ROLE
            value_text = (item.get("value_text") or "").strip()
            source_text = text_by_id[bid]
            # 원문에 없는 value_text 는 환각이므로 버린다 (블록 전체를 슬롯으로 강등)
            if value_text and source_text.strip() and value_text not in source_text:
                logger.warning("[classify] value_text 원문 불일치로 폐기 (%s): %r", bid, value_text[:30])
                value_text = ""
                if role == "mixed":
                    role = "value"
            cleaned.append({
                "id": bid,
                "role": role,
                "value_text": value_text,
                "slot_label": (item.get("slot_label") or "").strip(),
            })

        missing = set(text_by_id) - {c["id"] for c in cleaned}
        if missing:
            logger.warning("[classify] 미분류 %d개는 고정 텍스트 처리 (p%d): %s",
                           len(missing), page_no, sorted(missing)[:5])

        return {"doc_title": payload.get("doc_title") or source_name, "blocks": cleaned}
