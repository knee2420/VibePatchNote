/** 세그먼트 타입별 표현 토큰. 이 오버레이 전용이므로 여기서만 소유합니다. */
export interface SegmentTypeStyle {
  border: string;
  bg: string;
  hoverBg: string;
  badgeBg: string;
  badgeText: string;
  defaultLabel: string;
}

const FALLBACK_TYPE = 'paragraph';

export const segmentTypeStyles: Record<string, SegmentTypeStyle> = {
  table: {
    border: 'border-purple-500/90',
    bg: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/25',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    defaultLabel: 'Table',
  },
  list: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/25',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    defaultLabel: 'List',
  },
  section: {
    border: 'border-blue-500/90',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/25',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    defaultLabel: 'Section',
  },
  paragraph: {
    border: 'border-amber-500/90',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/25',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    defaultLabel: 'Block',
  },
};

export function getSegmentTypeStyle(type: string): SegmentTypeStyle {
  return segmentTypeStyles[type] || segmentTypeStyles[FALLBACK_TYPE];
}

export const SEGMENT_TYPE_OPTIONS = [
  { id: 'section', label: 'Section', color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'table', label: 'Table', color: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'list', label: 'List', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'paragraph', label: 'Block', color: 'bg-amber-600 hover:bg-amber-700' },
];
