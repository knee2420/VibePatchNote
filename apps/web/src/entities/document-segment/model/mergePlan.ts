/**
 * 병합을 실행하기 **전에** 결과를 계산한다.
 *
 * 화면 미리보기와 실제 실행이 같은 함수를 써야 한다. 따로 계산하면 "보여준 것과
 * 다른 결과"가 나오고, 그건 되돌리기가 있어도 신뢰를 잃는다.
 */
import type { DocumentSegmentItem } from './types';

/** 자기 면적의 이 비율 이상이 합병 영역에 들어오면 흡수된다. */
export const ABSORB_RATIO = 0.8;

export type MergeBlockedReason = 'too_few' | 'cross_page';

export interface MergePlan {
  ok: boolean;
  reason?: MergeBlockedReason;
  page: number | null;
  /** 합쳐진 뒤의 영역. 고른 것들을 감싸는 외곽 사각형. */
  box: [number, number, number, number] | null;
  /** 사용자가 직접 고른 것. */
  selectedIds: string[];
  /**
   * 고르지 않았지만 **영역 안에 들어와 함께 사라지는** 것.
   *
   * 세그먼트는 연속된 한 영역이므로, 제목과 캡션을 고르면 그 사이의 표도 같은
   * 영역이 된다. 사이에 있던 세그먼트를 남겨 두면 새 박스와 겹쳐 버리므로 함께
   * 흡수한다. 다만 **실행 전에 보여 줘야 한다** — 둘 골랐는데 다섯이 사라지면 사고다.
   */
  absorbedIds: string[];
}

function areaOf(box: readonly number[]): number {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function intersectionArea(a: readonly number[], b: readonly number[]): number {
  const height = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const width = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (height <= 0 || width <= 0) return 0;
  return height * width;
}

export function planMerge(segments: DocumentSegmentItem[], candidateIds: string[]): MergePlan {
  const selected = segments.filter((segment) => candidateIds.includes(segment.id));
  const empty: MergePlan = {
    ok: false,
    page: null,
    box: null,
    selectedIds: selected.map((segment) => segment.id),
    absorbedIds: [],
  };

  if (selected.length < 2) return { ...empty, reason: 'too_few' };
  const pages = new Set(selected.map((segment) => segment.page));
  if (pages.size !== 1) return { ...empty, reason: 'cross_page' };

  const page = selected[0].page;
  const box: [number, number, number, number] = [
    Math.min(...selected.map((segment) => segment.box_2d[0])),
    Math.min(...selected.map((segment) => segment.box_2d[1])),
    Math.max(...selected.map((segment) => segment.box_2d[2])),
    Math.max(...selected.map((segment) => segment.box_2d[3])),
  ];

  const absorbedIds = segments
    .filter((segment) => {
      if (segment.page !== page) return false;
      if (candidateIds.includes(segment.id)) return false;
      const own = areaOf(segment.box_2d);
      if (own <= 0) return false;
      return intersectionArea(segment.box_2d, box) / own >= ABSORB_RATIO;
    })
    .map((segment) => segment.id);

  return { ok: true, page, box, selectedIds: selected.map((s) => s.id), absorbedIds };
}

export function mergeBlockedMessage(reason: MergeBlockedReason): string {
  return reason === 'cross_page'
    ? '같은 페이지 안에서만 합칠 수 있습니다.'
    : '두 개 이상 골라야 합칩니다.';
}
