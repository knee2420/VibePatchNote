"""Stage D — 기하 충실도 채점.

"잘 나왔는지" 를 사람 눈 대신 숫자로 판정하기 위한 계층. 조립된 결과의 블록
위치를 원본 실측치와 IoU 로 비교한다. 렌더된 좌표를 넣으면 브라우저 렌더까지
검증할 수 있고, 넣지 않으면 조립 단계의 산술만 검증한다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from statistics import mean
from typing import Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.extract.geometry import PageGeometry

# 이 값 미만이면 "위치가 눈에 띄게 어긋났다" 로 본다.
IOU_PASS = 0.90

_BID = re.compile(r'data-bid="([^"]+)"')


@dataclass
class FidelityReport:
    blocks: int
    mean_iou: float
    pass_ratio: float
    min_iou: float
    missing: List[str]

    @property
    def ok(self) -> bool:
        return not self.missing and self.pass_ratio >= 1.0

    def summary(self) -> str:
        return (
            f"블록 {self.blocks}개 · 평균 IoU {self.mean_iou * 100:.2f}% · "
            f"통과율 {self.pass_ratio * 100:.1f}% · 최저 {self.min_iou * 100:.1f}%"
            + (f" · 미출력 {len(self.missing)}개" if self.missing else "")
        )


def iou(a: List[float], b: List[float]) -> float:
    """[x0, y0, x1, y1] 두 상자의 교집합/합집합."""
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[2], b[2]), min(a[3], b[3])
    if x1 <= x0 or y1 <= y0:
        return 0.0
    inter = (x1 - x0) * (y1 - y0)
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def emitted_ids(html: str) -> List[str]:
    """조립된 HTML 이 실제로 출력한 블록 id 목록."""
    return _BID.findall(html)


def score_page(
    page: "PageGeometry",
    html: str,
    rendered: Optional[Dict[str, List[float]]] = None,
) -> FidelityReport:
    """`rendered` 를 주면 브라우저 실측 대비, 없으면 출력 누락만 검사한다."""
    expected = {b.id: b.bbox for b in page.classifiable()}
    present = set(emitted_ids(html))
    missing = sorted(set(expected) - present)

    if rendered is None:
        ratio = (len(expected) - len(missing)) / len(expected) if expected else 1.0
        return FidelityReport(len(expected), ratio, ratio, ratio, missing)

    scores = []
    for bid, box in expected.items():
        got = rendered.get(bid)
        scores.append(iou(box, got) if got else 0.0)
    if not scores:
        return FidelityReport(0, 1.0, 1.0, 1.0, [])
    return FidelityReport(
        blocks=len(scores),
        mean_iou=mean(scores),
        pass_ratio=sum(1 for s in scores if s >= IOU_PASS) / len(scores),
        min_iou=min(scores),
        missing=missing,
    )
