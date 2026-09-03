/**
 * 스마트 마그넷 스냅 (순수 함수).
 *
 * 자석이 붙는 대상은 두 가지입니다.
 * 1. 같은 페이지의 다른 세그먼트 경계선 (특히 표 테두리)
 * 2. PDF 텍스트 엔진이 알려준 텍스트 줄의 Y 좌표
 */
import type { ViewerSegment } from '../../../types';

/** 0~1000 좌표계에서 20 ≈ 2%. 이 거리 안으로 들어오면 착 붙습니다. */
export const SNAP_THRESHOLD = 20;

export interface SnapAnchors {
  xList: number[];
  yList: number[];
}

export interface SnapResult {
  val: number;
  snapped: boolean;
  target: number | null;
}

export const EMPTY_ANCHORS: SnapAnchors = { xList: [], yList: [] };

/** 좌표를 가장 가까운 앵커로 흡착시킵니다. 임계값 밖이면 원래 좌표를 그대로 돌려줍니다. */
export function findSnapCoord(coord: number, targets: number[]): SnapResult {
  let minDiff = SNAP_THRESHOLD + 1;
  let snappedVal = coord;
  let targetFound: number | null = null;

  for (const target of targets) {
    const diff = Math.abs(coord - target);
    if (diff <= SNAP_THRESHOLD && diff < minDiff) {
      minDiff = diff;
      snappedVal = target;
      targetFound = target;
    }
  }

  return { val: snappedVal, snapped: targetFound !== null, target: targetFound };
}

/**
 * 스냅 앵커 목록을 만듭니다.
 * 지금 끌고 있는 세그먼트(excludeSegmentId)는 자기 자신에게 붙지 않도록 제외합니다.
 */
export function buildSnapAnchors(
  pageSegments: ViewerSegment[],
  textLines: number[] | undefined,
  excludeSegmentId: string | null
): SnapAnchors {
  const xList: number[] = [];
  const yList: number[] = [];

  for (const seg of pageSegments) {
    if (excludeSegmentId && seg.id === excludeSegmentId) continue;
    const [ymin, xmin, ymax, xmax] = seg.box_2d;
    xList.push(xmin, xmax);
    yList.push(ymin, ymax);
  }

  if (textLines && textLines.length > 0) {
    yList.push(...textLines);
  }

  return {
    xList: Array.from(new Set(xList)).sort((a, b) => a - b),
    yList: Array.from(new Set(yList)).sort((a, b) => a - b),
  };
}

export interface SnappedPoint {
  point: { x: number; y: number };
  guideX: number | null;
  guideY: number | null;
}

/** 한 점을 X/Y 양축 앵커에 동시에 흡착시킵니다. (신규 영역 생성의 시작점·현재점에 사용) */
export function snapPoint(
  point: { x: number; y: number },
  anchors: SnapAnchors,
  isSnapActive: boolean
): SnappedPoint {
  if (!isSnapActive) {
    return { point, guideX: null, guideY: null };
  }

  const snapX = findSnapCoord(point.x, anchors.xList);
  const snapY = findSnapCoord(point.y, anchors.yList);

  return {
    point: { x: snapX.val, y: snapY.val },
    guideX: snapX.target,
    guideY: snapY.target,
  };
}
