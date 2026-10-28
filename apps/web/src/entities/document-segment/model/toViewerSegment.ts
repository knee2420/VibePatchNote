/**
 * 백엔드 DTO ↔ 뷰어 패키지 계약 변환.
 *
 * **이 파일이 유일한 경계다.** 예전에는 백엔드 응답을 뷰어에 그대로 흘려보냈고,
 * 그래서 파이썬 직렬화 규약(`box_2d`, `content_summary`)이 범용 뷰어 패키지의
 * 공개 계약까지 끌고 갔다. 변환을 한 곳에 모아 두면 어느 쪽이 바뀌어도 고칠 곳이
 * 하나다.
 */
import type { SegmentTypeDescriptor, ViewerSegment } from '@vibe/document-viewer';

import type { DocumentSegmentItem } from './types';

/** 이 앱의 세그먼트 타입 어휘. 뷰어는 목록을 강제하지 않으므로 호스트가 넘긴다. */
export const DOCUMENT_SEGMENT_TYPES: SegmentTypeDescriptor[] = [
  { id: 'section', label: 'Section', color: '#0ea5e9' },
  { id: 'table', label: 'Table', color: '#6366f1' },
  { id: 'list', label: 'List', color: '#10b981' },
  { id: 'paragraph', label: 'Block', color: '#f59e0b' },
];

export function toViewerSegment(segment: DocumentSegmentItem): ViewerSegment {
  return {
    id: segment.id,
    page: segment.page,
    type: segment.type,
    label: segment.label,
    box: segment.box_2d,
    summary: segment.content_summary,
  };
}

export function fromViewerSegment(segment: ViewerSegment): DocumentSegmentItem {
  return {
    id: segment.id,
    page: segment.page,
    type: segment.type,
    label: segment.label,
    box_2d: segment.box as [number, number, number, number],
    content_summary: segment.summary,
  };
}

export function toViewerSegments(segments: DocumentSegmentItem[]): ViewerSegment[] {
  return segments.map(toViewerSegment);
}
