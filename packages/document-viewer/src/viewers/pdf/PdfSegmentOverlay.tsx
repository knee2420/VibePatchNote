import { memo, useCallback, useMemo } from 'react';

import type { ViewerSegment } from '../../types';
import { CreateSegmentPreview } from './segment-overlay/CreateSegmentPreview';
import { SegmentBox } from './segment-overlay/SegmentBox';
import { SnapGuideLines } from './segment-overlay/SnapGuideLines';
import { useSegmentDrag } from './segment-overlay/useSegmentDrag';
import { useSegmentSelection } from './segment-overlay/useSegmentSelection';

interface PdfSegmentOverlayProps {
  pageNumber: number;
  segments?: ViewerSegment[];
  /** PDF 텍스트 줄의 Y 좌표. 스마트 마그넷 스냅 앵커로 씁니다. */
  textLines?: number[];
  isEditMode?: boolean;
  enableSnap?: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
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
  textLines,
  isEditMode = false,
  enableSnap = true,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onSelectSegment,
}: PdfSegmentOverlayProps) {
  const pageSegments = useMemo(
    () => segments.filter((seg) => seg.page === pageNumber),
    [segments, pageNumber]
  );

  const selection = useSegmentSelection({
    pageSegments,
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
  });

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
      onMouseDown={drag.handleContainerMouseDown}
      className={`
        absolute inset-0 z-10 select-none overflow-visible nodrag nopan
        ${isEditMode ? 'pointer-events-auto' : 'pointer-events-none'}
        ${isEditMode && drag.isShiftDown ? 'cursor-crosshair' : 'cursor-default'}
      `}
    >
      <SnapGuideLines activeGuideX={drag.activeGuideX} activeGuideY={drag.activeGuideY} />

      {pageSegments.map((segment) => {
        const isSelected = selection.selectedId === segment.id;
        return (
          <SegmentBox
            key={segment.id}
            segment={segment}
            box={drag.boxOf(segment)}
            isEditMode={isEditMode}
            isSelected={isSelected}
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
    </div>
  );
});
