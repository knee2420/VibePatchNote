"""문서 레이아웃 기하 좌표 및 바운딩 박스 연산 유틸리티.

PDF 절대 포인트(pt) 좌표와 0~1000 상대 정규화 좌표 간의 상호 변환 및 교차(IoU) 연산을 전담합니다.
"""
from __future__ import annotations

from typing import List, Sequence, Tuple, Union


def normalize_coord(value: float, total: float) -> int:
    """단일 축 좌표를 0~1000 상대 정수로 정규화합니다."""
    if total <= 0:
        return 0
    return max(0, min(1000, round(value / total * 1000)))


def normalize_bbox(
    bbox: Sequence[float],
    page_width: float,
    page_height: float,
) -> List[int]:
    """절대 좌표 [x0, y0, x1, y1] (pt)를 0~1000 정규화 [ymin, xmin, ymax, xmax]로 변환합니다."""
    if len(bbox) < 4:
        return [0, 0, 0, 0]
    x0, y0, x1, y1 = bbox[:4]
    ymin = normalize_coord(y0, page_height)
    xmin = normalize_coord(x0, page_width)
    ymax = normalize_coord(y1, page_height)
    xmax = normalize_coord(x1, page_width)
    return [ymin, xmin, ymax, xmax]


def denormalize_bbox(
    norm_bbox: Sequence[int],
    page_width: float,
    page_height: float,
) -> List[float]:
    """0~1000 정규화 [ymin, xmin, ymax, xmax]를 절대 좌표 [x0, y0, x1, y1] (pt)로 역변환합니다."""
    if len(norm_bbox) < 4:
        return [0.0, 0.0, 0.0, 0.0]
    ymin, xmin, ymax, xmax = norm_bbox[:4]
    x0 = round((xmin / 1000.0) * page_width, 2)
    y0 = round((ymin / 1000.0) * page_height, 2)
    x1 = round((xmax / 1000.0) * page_width, 2)
    y1 = round((ymax / 1000.0) * page_height, 2)
    return [x0, y0, x1, y1]


def compute_box_iou(box1: Sequence[int], box2: Sequence[int]) -> float:
    """두 정규화 박스 [ymin, xmin, ymax, xmax] 간의 IoU (Intersection over Union)를 계산합니다."""
    if len(box1) < 4 or len(box2) < 4:
        return 0.0

    y_top = max(box1[0], box2[0])
    x_left = max(box1[1], box2[1])
    y_bottom = min(box1[2], box2[2])
    x_right = min(box1[3], box2[3])

    if y_bottom < y_top or x_right < x_left:
        return 0.0

    intersection_area = (y_bottom - y_top) * (x_right - x_left)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = float(area1 + area2 - intersection_area)

    if union_area <= 0:
        return 0.0
    return intersection_area / union_area
