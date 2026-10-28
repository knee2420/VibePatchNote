"""Stage 4: 품질 측정 및 충실도 채점 (Evaluation Track)."""
from .score.fidelity import FidelityReport, score_page

__all__ = ["FidelityReport", "score_page"]
