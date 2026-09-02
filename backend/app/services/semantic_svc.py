from app.core.antigravity.agent import AntigravitySubagentHarness

class SemanticService:
    """
    Business logic orchestrator for Phase 3 (Tagging and Metadata separation).
    """
    async def enrich_tree(self, tree_json: dict) -> dict:
        # Pass to Antigravity Subagent for deep tagging
        result = AntigravitySubagentHarness.run_semantic_tagging("dummy_path.json")
        return result
