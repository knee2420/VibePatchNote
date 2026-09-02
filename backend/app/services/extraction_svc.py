from app.core.workflow.engine import NativeWorkflowEngine

class ExtractionService:
    """
    Business logic orchestrator for Phase 1 and 2, utilizing our native workflow engine.
    """
    def __init__(self):
        self.workflow_engine = NativeWorkflowEngine()

    async def process_document(self, document_text: str):
        # 1. Classify & Reverse Engineer (Phase 1)
        meta = await self.workflow_engine.execute_classification_node(document_text)
        
        # 2. Extract Scaffold & Schema (Phase 2)
        tree = await self.workflow_engine.execute_extraction_pipeline(document_text, meta)
        
        return {"meta": meta, "tree": tree}
