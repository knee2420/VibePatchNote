import { memo, useCallback, useMemo } from 'react';

import type { SegmentBoxTuple, ViewerSegment } from '../../types';
import { CreateSegmentPreview } from './segment-overlay/CreateSegmentPreview';
import { MergePreviewBox } from './segment-overlay/MergePreviewBox';
import { SegmentBox } from './segment-overlay/SegmentBox';
import { SplitGuideLine } from './segment-overlay/SplitGuideLine';
import { SnapGuideLines } from './segment-overlay/SnapGuideLines';
import { useSegmentDrag } from './segment-overlay/useSegmentDrag';
import { useSegmentSelection } from './segment-overlay/useSegmentSelection';

interface PdfSegmentOverlayProps {
  pageNumber: number;
  segments?: ViewerSegment[];
  selectedSegmentId?: string | null;
  mergeCandidateIds?: string[];
  absorbedSegmentIds?: string[];
  mergePreviewBox?: SegmentBoxTuple | null;
  onToggleMergeCandidate?: (segmentId: string) => void;
  /** PDF 텍스트 줄의 Y 좌표. 스마트 마그넷 스냅 앵커로 씁니다. */
  textLines?: number[];
  isEditMode?: boolean;
  enableSnap?: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onSplitSegment?: (segmentId: string, axis: 'horizontal' | 'vertical') => void;
  onSelectSegment?: (segment: ViewerSegment) => void;
}

/**
 * PDF 페이지 위에 겹치는 세그먼트 편집 오버레이.
 *
 * 이 컴포넌트는 조합만 합니다.
 * - 선택/라벨 편집 상태: `useSegmentSelection`
 * - 생성/이동/리사이즈 + 스냅: `useSegmentDrag`
 * - 좌표 계산: `segment-overlay/geometry.ts`, `resizeSegmentBox.ts`, `snapping.ts`
 */
export const PdfSegmentOverlay = memo(function PdfSegmentOverlay({
  pageNumber,
  segments = [],
  selectedSegmentId,
  mergeCandidateIds,
  absorbedSegmentIds,
  mergePreviewBox,
  onToggleMergeCandidate,
  textLines,
  isEditMode = false,
  enableSnap = true,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onSplitSegment,
  onSelectSegment,
}: PdfSegmentOverlayProps) {
  const pageSegments = useMemo(
    () => segments.filter((seg) => seg.page === pageNumber),
    [segments, pageNumber]
  );

  const selection = useSegmentSelection({
    pageSegments,
    selectedSegmentId,
    isEditMode,
    onUpdateSegment,
    onDeleteSegment,
  });

  const drag = useSegmentDrag({
    pageNumber,
    pageSegments,
    textLines,
    isEditMode,
    enableSnap,
    setSelectedId: selection.setSelectedId,
    onSelectSegment,
    onCreateSegment,
    onUpdateSegment,
    onSplitSegment,
  });

  const splitTarget = drag.splitRequest
    ? pageSegments.find((segment) => segment.id === drag.splitRequest?.segmentId)
    : undefined;

  const handleSelect = useCallback(
    (segment: ViewerSegment) => {
      selection.setSelectedId(segment.id);
      selection.setIsEditing(false);
      onSelectSegment?.(segment);
    },
    [selection, onSelectSegment]
  );

  const cancelEdit = useCallback(() => selection.setIsEditing(false), [selection]);

  return (
    <div
      ref={drag.containerRef}
      onPointerDown={drag.handleContainerPointerDown}
      className={`
        absolute inset-0 z-10 select-none overflow-visible nodrag nopan
        ${isEditMode ? 'pointer-events-auto' : 'pointer-events-none'}
        ${isEditMode && drag.isShiftDown ? 'cursor-crosshair' : 'cursor-default'}
      `}
    >
      <SnapGuideLines activeGuideX={drag.activeGuideX} activeGuideY={drag.activeGuideY} />

      {mergePreviewBox && isEditMode && (
        <MergePreviewBox box={mergePreviewBox} absorbedCount={absorbedSegmentIds?.length ?? 0} />
      )}

      {pageSegments.map((segment) => {
        const isSelected = selection.selectedId === segment.id;
        const candidateOrder = (mergeCandidateIds?.indexOf(segment.id) ?? -1) + 1;
        return (
          <SegmentBox
            key={segment.id}
            segment={segment}
            box={drag.boxOf(segment)}
            isEditMode={isEditMode}
            isSelected={isSelected}
            candidateOrder={candidateOrder}
            isAbsorbed={absorbedSegmentIds?.includes(segment.id) ?? false}
            onToggleMergeCandidate={onToggleMergeCandidate}
            isHovered={selection.hoveredId === segment.id}
            isResizing={drag.resizingSegmentId === segment.id}
            isCreating={drag.isCreating}
            isEditing={selection.isEditing}
            editingLabel={selection.editingLabel}
            boxRef={isSelected ? selection.activeBoxRef : null}
            onStartDrag={drag.startDrag}
            onSelect={handleSelect}
            onStartLabelEdit={selection.startLabelEdit}
            onHoverChange={selection.setHoveredId}
            onDelete={selection.deleteSegment}
            onSplit={drag.beginSplit}
            onClearSelection={selection.clearSelection}
            onEditingLabelChange={selection.setEditingLabel}
            onSaveLabel={selection.saveLabel}
            onCancelEdit={cancelEdit}
            onChangeType={selection.changeType}
          />
        );
      })}

      {isEditMode && drag.isCreating && drag.createPreviewBox && (
        <CreateSegmentPreview box={drag.createPreviewBox} />
      )}

      {isEditMode && splitTarget && drag.splitRequest && (
        <SplitGuideLine
          box={splitTarget.box}
          axis={drag.splitRequest.axis}
          position={drag.splitPosition}
        />
      )}
    </div>
  );
});
