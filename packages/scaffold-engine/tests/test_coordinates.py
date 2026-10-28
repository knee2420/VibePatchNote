from scaffold_engine.utils.coordinates import (
    compute_box_iou,
    denormalize_bbox,
    normalize_bbox,
    normalize_coord,
)


def test_normalize_coord():
    assert normalize_coord(50, 100) == 500
    assert normalize_coord(0, 100) == 0
    assert normalize_coord(100, 100) == 1000
    assert normalize_coord(150, 100) == 1000
    assert normalize_coord(-10, 100) == 0
    assert normalize_coord(50, 0) == 0


def test_normalize_and_denormalize_bbox():
    page_w, page_h = 600.0, 800.0
    orig_box = [60.0, 80.0, 300.0, 400.0]  # x0, y0, x1, y1
    norm = normalize_bbox(orig_box, page_w, page_h)  # [ymin, xmin, ymax, xmax]

    assert norm == [100, 100, 500, 500]

    denorm = denormalize_bbox(norm, page_w, page_h)
    assert denorm == orig_box


def test_compute_box_iou():
    box1 = [100, 100, 200, 200]
    box2 = [100, 100, 200, 200]
    assert compute_box_iou(box1, box2) == 1.0

    box3 = [300, 300, 400, 400]
    assert compute_box_iou(box1, box3) == 0.0

    box4 = [150, 150, 250, 250]
    iou = compute_box_iou(box1, box4)
    assert 0.1 < iou < 0.2
