/**
 * 관계가 **기하학적으로 떨어져 있는지** 판정한다.
 *
 * 사람은 각주·캡션처럼 영역 밖에 있는 것도 일부러 붙인다. 그건 막을 일이 아니라
 * 알고리즘이 절대 못 맞히는, 사람이 고쳐 줘야 하는 케이스다. 다만 **떨어져 있다는
 * 사실은 보여야 한다.** 안 보여 주면 오조작과 의도를 구분할 방법이 없다.
 */
type Box = readonly number[];

/** 이 비율보다 적게 겹치면 "영역 밖"으로 본다. */
export const OUTSIDE_RATIO = 0.5;

function areaOf(box: Box): number {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function intersectionArea(a: Box, b: Box): number {
  const height = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const width = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (height <= 0 || width <= 0) return 0;
  return height * width;
}

/**
 * 대상이 소속 세그먼트 영역 밖에 있는가.
 *
 * 좌표를 모르는 대상(박스 없는 와이어프레임 슬롯 등)은 판정하지 않는다 — 모르는
 * 것을 "밖"이라고 단정하면 멀쩡한 관계에 경고가 붙는다.
 */
export function isOutsideOwner(targetBox: Box | null | undefined, ownerBox: Box | null | undefined): boolean {
  if (!targetBox || !ownerBox) return false;
  const own = areaOf(targetBox);
  if (own <= 0) return false;
  return intersectionArea(targetBox, ownerBox) / own < OUTSIDE_RATIO;
}
