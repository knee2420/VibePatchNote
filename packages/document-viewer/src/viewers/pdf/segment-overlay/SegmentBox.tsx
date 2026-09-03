import { memo, type Ref } from 'react';

import type { ViewerSegment } from '../../../types';
import { toPercentStyle, type ResizeHandle, type SegmentBox as Box } from './geometry';
import { getSegmentTypeStyle } from './segmentTypeStyles';
import { SegmentInfoPanel } from './SegmentInfoPanel';
import { SegmentResizeHandles } from './SegmentResizeHandles';

interface SegmentBoxProps {
  segment: ViewerSegment;
  /** 드래그 중이면 초안 박스, 아니면 원본 박스. */
  box: Box;
  isEditMode: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isResizing: boolean;
  isCreating: boolean;
  isEditing: boolean;
  editingLabel: string;
  boxRef: Ref<HTMLDivElement> | null;
  onStartDrag: (handle: ResizeHandle, segment: ViewerSegment, e: React.MouseEvent) => void;
  onSelect: (segment: ViewerSegment) => void;
  onStartLabelEdit: (segment: ViewerSegment) => void;
  onHoverChange: (segmentId: string | null) => void;
  onDelete: (segmentId: string) => void;
  onClearSelection: () => void;
  onEditingLabelChange: (label: string) => void;
  onSaveLabel: () => void;
  onCancelEdit: () => void;
  onChangeType: (type: string) => void;
}

/** 문서 위에 겹쳐 그려지는 세그먼트 바운딩 박스 한 개. */
export const SegmentBox = memo(function SegmentBox({
  segment,
  box,
  isEditMode,
  isSelected,
  isHovered,
  isResizing,
  isCreating,
  isEditing,
  editingLabel,
  boxRef,
  onStartDrag,
  onSelect,
  onStartLabelEdit,
  onHoverChange,
  onDelete,
  onClearSelection,
  onEditingLabelChange,
  onSaveLabel,
  onCancelEdit,
  onChangeType,
}: SegmentBoxProps) {
  const typeStyle = getSegmentTypeStyle(segment.type);
  const showPanel = isEditMode && !isResizing && !isCreating && (isHovered || isSelected);

  return (
    <div
      ref={boxRef}
      // 박스 본체 아무 곳이나 잡고 끌면 즉시 이동합니다.
      onMouseDown={(e) => isEditMode && onStartDrag('move', segment, e)}
      onClick={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        onSelect(segment);
      }}
      onDoubleClick={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        onStartLabelEdit(segment);
      }}
      onMouseEnter={() => onHoverChange(segment.id)}
      onMouseLeave={() => onHoverChange(null)}
      style={toPercentStyle(box)}
      className={`
        absolute border-2 transition-[border-color,background-color] duration-75 group/seg
        ${isEditMode ? 'pointer-events-auto cursor-move' : 'pointer-events-none cursor-default'}
        ${typeStyle.border}
        ${
          isSelected && isEditMode
            ? '!border-purple-600 ring-2 ring-purple-400/80 bg-purple-500/20 z-20 shadow-md'
            : typeStyle.bg
        }
        ${isHovered && !isSelected && isEditMode ? typeStyle.hoverBg : ''}
      `}
    >
      {/* 상단 테두리와 겹치지 않도록 -top-5 에 띄우는 라벨 뱃지 */}
      <div
        className={`
          absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs
          flex items-center gap-1 transition-transform duration-150 pointer-events-none z-20
          ${typeStyle.badgeBg} ${typeStyle.badgeText}
          ${isHovered && isEditMode ? 'scale-105 shadow-md' : 'opacity-90'}
        `}
      >
        <span className="uppercase text-[9px] opacity-85">{typeStyle.defaultLabel}</span>
        <span className="max-w-[140px] truncate font-medium">{segment.label}</span>
      </div>

      {showPanel && (
        <SegmentInfoPanel
          segment={segment}
          typeStyle={typeStyle}
          isSelected={isSelected}
          isEditing={isEditing}
          editingLabel={editingLabel}
          onStartEdit={() => onStartLabelEdit(segment)}
          onDelete={() => onDelete(segment.id)}
          onClose={onClearSelection}
          onEditingLabelChange={onEditingLabelChange}
          onSaveLabel={onSaveLabel}
          onCancelEdit={onCancelEdit}
          onChangeType={onChangeType}
        />
      )}

      {isSelected && isEditMode && (
        <SegmentResizeHandles
          onHandleMouseDown={(handle, e) => onStartDrag(handle, segment, e)}
        />
      )}
    </div>
  );
});
