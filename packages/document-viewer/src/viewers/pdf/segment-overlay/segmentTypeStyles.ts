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
    border: 'border-indigo-500/80',
    bg: 'bg-indigo-500/10',
    hoverBg: 'hover:bg-indigo-500/20',
    badgeBg: 'bg-indigo-50 border border-indigo-200',
    badgeText: 'text-indigo-700',
    defaultLabel: 'Table',
  },
  list: {
    border: 'border-emerald-500/80',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/20',
    badgeBg: 'bg-emerald-50 border border-emerald-200',
    badgeText: 'text-emerald-700',
    defaultLabel: 'List',
  },
  section: {
    border: 'border-sky-500/80',
    bg: 'bg-sky-500/10',
    hoverBg: 'hover:bg-sky-500/20',
    badgeBg: 'bg-sky-50 border border-sky-200',
    badgeText: 'text-sky-700',
    defaultLabel: 'Section',
  },
  paragraph: {
    border: 'border-amber-500/80',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    badgeBg: 'bg-amber-50 border border-amber-200',
    badgeText: 'text-amber-700',
    defaultLabel: 'Block',
  },
};

export function getSegmentTypeStyle(type: string): SegmentTypeStyle {
  return segmentTypeStyles[type] || segmentTypeStyles[FALLBACK_TYPE];
}

export const SEGMENT_TYPE_OPTIONS = [
  { id: 'section', label: 'Section', color: 'bg-sky-100 text-sky-800 border border-sky-300 hover:bg-sky-200' },
  { id: 'table', label: 'Table', color: 'bg-indigo-100 text-indigo-800 border border-indigo-300 hover:bg-indigo-200' },
  { id: 'list', label: 'List', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' },
  { id: 'paragraph', label: 'Block', color: 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200' },
];
