/**
 * 세그먼트 애그리거트의 공개 경계.
 *
 * 세그먼트는 참고 문서 카드의 부가 기능이 아니라 **독립 산출물**이다. 자기 백엔드
 * 도메인(`/api/v1/segments`), 자기 아티팩트 이력, 자기 관계 결정을 갖는다. 그래서
 * `reference-document` 안에 묻어 두지 않고 이 슬라이스가 소유한다.
 */
export { segmentApi } from './api/segmentApi';
export { SEGMENT_ELEMENT_MIME } from './model/dragTransfer';
export { ABSORB_RATIO, mergeBlockedMessage, planMerge } from './model/mergePlan';
export { OUTSIDE_RATIO, isOutsideOwner } from './model/containment';
export type { MergeBlockedReason, MergePlan } from './model/mergePlan';
export {
  DOCUMENT_SEGMENT_TYPES,
  fromViewerSegment,
  toViewerSegment,
  toViewerSegments,
} from './model/toViewerSegment';
export { useDocumentSegments } from './model/useDocumentSegments';
export { useSegmentEditing } from './model/useSegmentEditing';
export { useSegmentStructure } from './model/useSegmentStructure';
export { SegmentStructureTree } from './ui/SegmentStructureTree';
export type {
  DocumentSegmentItem,
  StructureElementSelection,
  RelationshipTargetKind,
  SegmentArtifactResponse,
  SegmentMappingItem,
  SegmentStructureResponse,
  SegmentStructureTarget,
} from './model/types';
