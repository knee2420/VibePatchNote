"""Fidelity Scoring (하위 호환성 래퍼).

정본은 `scaffold_engine.wireframe.score.fidelity` 에 있습니다.
"""
from scaffold_engine.wireframe.score.fidelity import (
    IOU_PASS,
    FidelityReport,
    emitted_ids,
    iou,
    score_page,
)

__all__ = [
    "FidelityReport",
    "IOU_PASS",
    "emitted_ids",
    "iou",
    "score_page",
]
