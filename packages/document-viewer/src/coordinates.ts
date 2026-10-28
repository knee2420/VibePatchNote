/**
 * 좌표 스케일 경계 변환.
 *
 * 패키지 내부는 **항상 0~1000** 정규 좌표로 계산한다(기하·스냅·리사이즈가 전부
 * 이 가정 위에 있다). 호스트가 0~1 같은 다른 스케일을 쓴다면, 계산식을 전부
 * 고치는 대신 들어올 때와 나갈 때 한 번씩만 환산한다.
 */
import type { SegmentBoxTuple } from './types';

export const INTERNAL_COORDINATE_SCALE = 1000;

function convert(box: SegmentBoxTuple, factor: number): SegmentBoxTuple {
  return [box[0] * factor, box[1] * factor, box[2] * factor, box[3] * factor];
}

/** 호스트 좌표 → 패키지 내부(0~1000). */
export function toInternalBox(box: SegmentBoxTuple, hostScale: number): SegmentBoxTuple {
  if (hostScale === INTERNAL_COORDINATE_SCALE) return box;
  return convert(box, INTERNAL_COORDINATE_SCALE / hostScale).map(Math.round) as SegmentBoxTuple;
}

/** 패키지 내부(0~1000) → 호스트 좌표. */
export function toHostBox(box: SegmentBoxTuple, hostScale: number): SegmentBoxTuple {
  if (hostScale === INTERNAL_COORDINATE_SCALE) return box;
  return convert(box, hostScale / INTERNAL_COORDINATE_SCALE);
}
