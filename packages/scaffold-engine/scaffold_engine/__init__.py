"""Scaffold Engine Package Root.

Host-independent AI Document Scaffolding Engine for Tiptap & Antigravity.
"""
from .types import ScaffoldExtractResult, ScaffoldMeta
from .pipeline import ScaffoldPipeline

__all__ = [
    "ScaffoldExtractResult",
    "ScaffoldMeta",
    "ScaffoldPipeline",
]
