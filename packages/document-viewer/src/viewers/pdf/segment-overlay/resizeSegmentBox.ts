/**
 * 리사이즈/이동 결과 박스 계산 (순수 함수).
 * React 상태를 만지지 않으므로 드래그 중 60fps 로 반복 호출해도 안전합니다.
 */
import {
  clamp,
  MIN_SEGMENT_SIZE,
  NORMALIZED_MAX,
  type ResizeHandle,
  type SegmentBox,
} from './geometry';
import { findSnapCoord, type SnapAnchors } from './snapping';

export interface ResizeInput {
  handle: ResizeHandle;
  initialBox: SegmentBox;
  /** 드래그 시작점 대비 이동량 (0~1000 정규화). */
  deltaX: number;
  deltaY: number;
  anchors: SnapAnchors;
  isSnapActive: boolean;
}

export interface ResizeResult {
  box: SegmentBox;
  /** 스냅이 걸린 가이드선 좌표. 걸리지 않았으면 null. */
  guideX: number | null;
  guideY: number | null;
}

/** 박스 전체를 평행 이동합니다. 네 변 중 어느 쪽이든 자석에 붙을 수 있습니다. */
function moveBox(input: ResizeInput): ResizeResult {
  const [initYmin, initXmin, initYmax, initXmax] = input.initialBox;
  const width = initXmax - initXmin;
  const height = initYmax - initYmin;

  let xmin = clamp(initXmin + input.deltaX, 0, NORMALIZED_MAX - width);
  let ymin = clamp(initYmin + input.deltaY, 0, NORMALIZED_MAX - height);
  let guideX: number | null = null;
  let guideY: number | null = null;

  if (input.isSnapActive) {
    // 좌측 변이 먼저, 붙지 않으면 우측 변이 자석에 걸립니다.
    const snapLeft = findSnapCoord(xmin, input.anchors.xList);
    const snapRight = findSnapCoord(xmin + width, input.anchors.xList);
    if (snapLeft.snapped) {
      xmin = snapLeft.val;
      guideX = snapLeft.target;
    } else if (snapRight.snapped) {
      xmin = snapRight.val - width;
      guideX = snapRight.target;
    }

    const snapTop = findSnapCoord(ymin, input.anchors.yList);
    const snapBottom = findSnapCoord(ymin + height, input.anchors.yList);
    if (snapTop.snapped) {
      ymin = snapTop.val;
      guideY = snapTop.target;
    } else if (snapBottom.snapped) {
      ymin = snapBottom.val - height;
      guideY = snapBottom.target;
    }
  }

  return { box: [ymin, xmin, ymin + height, xmin + width], guideX, guideY };
}

/** 잡은 핸들에 해당하는 변만 움직입니다. */
function resizeEdges(input: ResizeInput): ResizeResult {
  const [initYmin, initXmin, initYmax, initXmax] = input.initialBox;
  let [ymin, xmin, ymax, xmax] = [initYmin, initXmin, initYmax, initXmax];
  let guideX: number | null = null;
  let guideY: number | null = null;

  const snapOrRaw = (raw: number, targets: number[]) => {
    if (!input.isSnapActive) return { value: raw, guide: null as number | null };
    const snap = findSnapCoord(raw, targets);
    return { value: snap.val, guide: snap.snapped ? snap.target : null };
  };

  if (input.handle.includes('t')) {
    const raw = clamp(initYmin + input.deltaY, 0, initYmax - MIN_SEGMENT_SIZE);
    const { value, guide } = snapOrRaw(raw, input.anchors.yList);
    ymin = value;
    if (guide !== null) guideY = guide;
  }
  if (input.handle.includes('b')) {
    const raw = clamp(initYmax + input.deltaY, initYmin + MIN_SEGMENT_SIZE, NORMALIZED_MAX);
    const { value, guide } = snapOrRaw(raw, input.anchors.yList);
    ymax = value;
    if (guide !== null) guideY = guide;
  }
  if (input.handle.includes('l')) {
    const raw = clamp(initXmin + input.deltaX, 0, initXmax - MIN_SEGMENT_SIZE);
    const { value, guide } = snapOrRaw(raw, input.anchors.xList);
    xmin = value;
    if (guide !== null) guideX = guide;
  }
  if (input.handle.includes('r')) {
    const raw = clamp(initXmax + input.deltaX, initXmin + MIN_SEGMENT_SIZE, NORMALIZED_MAX);
    const { value, guide } = snapOrRaw(raw, input.anchors.xList);
    xmax = value;
    if (guide !== null) guideX = guide;
  }

  return { box: [ymin, xmin, ymax, xmax], guideX, guideY };
}

export function resizeSegmentBox(input: ResizeInput): ResizeResult {
  return input.handle === 'move' ? moveBox(input) : resizeEdges(input);
}
