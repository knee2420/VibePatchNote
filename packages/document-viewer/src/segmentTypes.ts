/**
 * 세그먼트 타입 어휘는 **호스트가 정한다.**
 *
 * 예전에는 이 패키지가 `table | list | section | paragraph` 네 가지를 닫힌 집합으로
 * 소유했다. 그래서 다른 호스트가 `figure`, `form`, `header_footer` 를 쓰면 전부
 * `paragraph` 로 뭉개져 한 색으로 보였다. 어휘는 문서 도메인의 것이지 뷰어의 것이
 * 아니다. 뷰어는 "모르는 타입도 서로 구분되게 그린다"만 보장한다.
 */

export interface SegmentTypeDescriptor {
  /** `ViewerSegment.type` 과 대조할 식별자. */
  id: string;
  /** 배지에 표시할 짧은 이름. */
  label: string;
  /** 기준 색(모든 유효한 CSS 색). 생략하면 팔레트에서 결정론적으로 배정된다. */
  color?: string;
}

export interface ResolvedSegmentType {
  id: string;
  label: string;
  color: string;
}

/**
 * 타입을 모를 때 쓰는 팔레트.
 *
 * 무작위가 아니라 타입 문자열의 해시로 고르므로, 같은 타입은 항상 같은 색이다.
 * 세션마다 색이 바뀌면 사용자가 색으로 타입을 기억할 수 없다.
 */
export const SEGMENT_TONE_PALETTE: readonly string[] = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#8b5cf6', // violet
  '#ef4444', // red
];

/** 호스트가 아무것도 주지 않았을 때의 기본 어휘. */
export const DEFAULT_SEGMENT_TYPES: readonly SegmentTypeDescriptor[] = [
  { id: 'section', label: 'Section', color: '#0ea5e9' },
  { id: 'table', label: 'Table', color: '#6366f1' },
  { id: 'list', label: 'List', color: '#10b981' },
  { id: 'paragraph', label: 'Block', color: '#f59e0b' },
];

function hashToneIndex(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % SEGMENT_TONE_PALETTE.length;
}

/** `header_footer` → `Header Footer`. 모르는 타입도 읽을 수 있게 표시한다. */
function humanize(type: string): string {
  const words = type.replace(/[_-]+/g, ' ').trim();
  if (!words) return 'Segment';
  return words.replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * 타입 하나를 표시 정보로 바꾼다. **모르는 타입도 버리지 않는다.**
 */
export function resolveSegmentType(
  type: string,
  descriptors: readonly SegmentTypeDescriptor[] = DEFAULT_SEGMENT_TYPES
): ResolvedSegmentType {
  const found = descriptors.find((descriptor) => descriptor.id === type);
  if (found) {
    return { id: found.id, label: found.label, color: found.color ?? SEGMENT_TONE_PALETTE[hashToneIndex(found.id)] };
  }
  return { id: type, label: humanize(type), color: SEGMENT_TONE_PALETTE[hashToneIndex(type)] };
}

/**
 * 기준 색 하나에서 테두리·배경·배지 색을 파생한다.
 *
 * 색을 Tailwind 클래스 문자열로 들고 있으면 Tailwind 가 없는 호스트에서는 아무
 * 색도 나오지 않는다. 그래서 데이터에서 오는 색은 인라인 CSS 변수로 넘긴다.
 */
export function segmentToneVars(color: string): Record<string, string> {
  return {
    '--seg-color': color,
    '--seg-fill': `color-mix(in srgb, ${color} 10%, transparent)`,
    '--seg-fill-hover': `color-mix(in srgb, ${color} 20%, transparent)`,
    '--seg-badge-bg': `color-mix(in srgb, ${color} 14%, white)`,
    '--seg-badge-border': `color-mix(in srgb, ${color} 35%, white)`,
    '--seg-badge-text': `color-mix(in srgb, ${color} 75%, black)`,
  };
}
