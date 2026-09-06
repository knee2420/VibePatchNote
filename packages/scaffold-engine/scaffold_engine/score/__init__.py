"""Stage D — 기하 충실도 채점."""
from .fidelity import FidelityReport, iou, score_page

__all__ = ["FidelityReport", "score_page", "iou"]
