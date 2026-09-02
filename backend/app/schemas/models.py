from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DocumentMeta(BaseModel):
    domain: str = Field(..., description="e.g., youtube_script, proposal")
    goal: str = Field(..., description="Reverse-engineered goal of the reference")
    attributes: Dict[str, Any] = Field(default_factory=dict)

class SegmentNode(BaseModel):
    id: str
    type: str = Field(..., description="e.g., heading, paragraph, list")
    content: str
    semantic_role: Optional[str] = None
    children: List['SegmentNode'] = []

# Resolve forward references
SegmentNode.model_rebuild()

class DocumentTree(BaseModel):
    document_id: str
    meta: DocumentMeta
    root: SegmentNode

class BlankTemplate(BaseModel):
    template_id: str
    domain: str
    scaffold_schema: Dict[str, Any]
