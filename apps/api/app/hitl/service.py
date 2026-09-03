"""hitl(Human-in-the-Loop) 도메인의 비즈니스 로직."""
from typing import Any, Dict


class SemanticService:
    """
    Phase 3~4 오케스트레이터.

    Phase 3 은 추출된 트리에 의미 태그를 붙이고,
    Phase 4 는 사람이 수정한 세그먼트 경계/트리 구조를 반영합니다.
    """

    async def enrich_tree(self, tree_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 3: 추출된 트리에 의미 태그를 부여합니다.

        TODO: 이 도메인이 소유할 태깅 프롬프트를 `app/hitl/prompts.py` 에 정의하고
              NativeWorkflowEngine.execute_agent_json 으로 실행할 것.
        """
        return {"status": "pending", "enriched_tree": {}}

    async def get_enriched_tree(self, document_id: str) -> Dict[str, Any]:
        """Phase 3 결과 트리를 조회합니다."""
        # TODO: Load persisted enriched tree for the document
        return {"document_id": document_id, "tree": {}, "status": "success"}

    async def update_segment_boundary(
        self, document_id: str, segment_id: str, new_bounds: Dict[str, Any]
    ) -> str:
        """Phase 4: 세그먼트 경계 수동 조정(Split/Merge)을 반영합니다."""
        # TODO: Update DB and recalculate children
        return "Segment updated"

    async def update_modular_tree(
        self, document_id: str, updated_tree: Dict[str, Any]
    ) -> str:
        """Phase 4: 재구성된 트리 구조를 저장합니다."""
        # TODO: Upsert new tree structure to DB
        return "Tree structure saved"


semantic_service = SemanticService()
