/**
 * 세그먼트 오버레이가 쓰는 좌표 계산 (순수 함수).
 *
 * 좌표계는 문서 페이지를 0~1000 으로 정규화한 [ymin, xmin, ymax, xmax] 입니다.
 * 화면 픽셀에 의존하지 않으므로 페이지 확대/축소와 무관하게 값이 유지됩니다.
 */

export type ResizeHandle = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'move';

/** [ymin, xmin, ymax, xmax] — 0~1000 정규화 좌표. */
export type SegmentBox = [number, number, number, number];

export interface Point {
  x: number;
  y: number;
}

export const NORMALIZED_MAX = 1000;

/** 이보다 작은 영역은 오조작으로 보고 만들거나 줄이지 않습니다. */
export const MIN_SEGMENT_SIZE = 20;

export function clamp(value: number, min = 0, max = NORMALIZED_MAX): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export interface ContainerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 클라이언트 마우스 좌표를 0~1000 정규화 좌표로 변환합니다. */
export function clientToNormalized(
  clientX: number,
  clientY: number,
  rect: ContainerRect
): Point {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * NORMALIZED_MAX),
    y: clamp(((clientY - rect.top) / rect.height) * NORMALIZED_MAX),
  };
}

/** 정규화 좌표 박스를 CSS 퍼센트 위치로 바꿉니다. */
export function toPercentStyle(box: SegmentBox) {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    top: `${ymin / 10}%`,
    left: `${xmin / 10}%`,
    height: `${(ymax - ymin) / 10}%`,
    width: `${(xmax - xmin) / 10}%`,
  };
}

/** 드래그 시작점과 현재점으로 정규화된 박스를 만듭니다. */
export function normalizeDragRect(start: Point, current: Point): SegmentBox {
  return [
    Math.min(start.y, current.y),
    Math.min(start.x, current.x),
    Math.max(start.y, current.y),
    Math.max(start.x, current.x),
  ];
}

/** 사용자가 만들기에 충분한 크기인지 판정합니다. */
export function isDrawableBox(box: SegmentBox): boolean {
  const [ymin, xmin, ymax, xmax] = box;
  return ymax - ymin >= MIN_SEGMENT_SIZE && xmax - xmin >= MIN_SEGMENT_SIZE;
}
