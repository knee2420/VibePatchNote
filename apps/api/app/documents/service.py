import os
import shutil
from fastapi import UploadFile, HTTPException
from app.core.workflow.engine import NativeWorkflowEngine

UPLOAD_DIR = "uploads"

def save_uploaded_file(file: UploadFile) -> str:
    """
    Saves an UploadFile to the local filesystem.
    Returns the absolute path to the saved file.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    return os.path.abspath(file_path)

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
