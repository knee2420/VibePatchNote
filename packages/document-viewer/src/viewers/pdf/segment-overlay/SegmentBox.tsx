import { memo, type Ref } from 'react';

import { resolveSegmentType, segmentToneVars } from '../../../segmentTypes';
import type { ViewerSegment } from '../../../types';
import { useSegmentTypes } from '../../../viewerConfig';
import { toPercentStyle, type ResizeHandle, type SegmentBox as Box } from './geometry';
import { SegmentInfoPanel } from './SegmentInfoPanel';
import { SegmentResizeHandles } from './SegmentResizeHandles';

interface SegmentBoxProps {
  segment: ViewerSegment;
  /** 드래그 중이면 초안 박스, 아니면 원본 박스. */
  box: Box;
  isEditMode: boolean;
  isSelected: boolean;
  /** 병합 후보 순번(1부터). 후보가 아니면 0. */
  candidateOrder: number;
  /** 병합하면 함께 사라지는 대상인가. */
  isAbsorbed: boolean;
  isHovered: boolean;
  isResizing: boolean;
  isCreating: boolean;
  isEditing: boolean;
  editingLabel: string;
  boxRef: Ref<HTMLDivElement> | null;
  onStartDrag: (handle: ResizeHandle, segment: ViewerSegment, e: React.PointerEvent) => void;
  onSelect: (segment: ViewerSegment) => void;
  onToggleMergeCandidate?: (segmentId: string) => void;
  onStartLabelEdit: (segment: ViewerSegment) => void;
  onHoverChange: (segmentId: string | null) => void;
  onDelete: (segmentId: string) => void;
  onSplit?: (segmentId: string, axis: 'horizontal' | 'vertical') => void;
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
  candidateOrder,
  isAbsorbed,
  isHovered,
  isResizing,
  isCreating,
  isEditing,
  editingLabel,
  boxRef,
  onStartDrag,
  onSelect,
  onToggleMergeCandidate,
  onStartLabelEdit,
  onHoverChange,
  onDelete,
  onSplit,
  onClearSelection,
  onEditingLabelChange,
  onSaveLabel,
  onCancelEdit,
  onChangeType,
}: SegmentBoxProps) {
  const segmentTypes = useSegmentTypes();
  const resolved = resolveSegmentType(segment.type, segmentTypes);
  const showPanel = isEditMode && !isResizing && !isCreating && (isHovered || isSelected);
  const isCandidate = candidateOrder > 0;
  const isEmphasized = (isSelected || isCandidate) && isEditMode;

  return (
    <div
      ref={boxRef}
      // 박스 본체 아무 곳이나 잡고 끌면 즉시 이동합니다.
      onPointerDown={(e) => isEditMode && onStartDrag('move', segment, e)}
      onClick={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        // Ctrl/Cmd + 클릭은 병합 후보 토글. Shift 는 이미 "빈 곳 드래그로 새 영역
        // 만들기"에 쓰고 있어 겹치면 안 된다.
        if ((e.ctrlKey || e.metaKey) && onToggleMergeCandidate) {
          onToggleMergeCandidate(segment.id);
          return;
        }
        onSelect(segment);
      }}
      onDoubleClick={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        onStartLabelEdit(segment);
      }}
      onMouseEnter={() => onHoverChange(segment.id)}
      onMouseLeave={() => onHoverChange(null)}
      // 색은 데이터(타입)에서 오므로 CSS 변수로 넘긴다. Tailwind 클래스 문자열로
      // 들고 있으면 Tailwind 가 없는 호스트에서 아무 색도 나오지 않는다.
      style={{
        ...toPercentStyle(box),
        ...segmentToneVars(resolved.color),
        borderColor: isEmphasized ? undefined : 'var(--seg-color)',
        backgroundColor: isEmphasized
          ? undefined
          : isHovered && isEditMode
            ? 'var(--seg-fill-hover)'
            : 'var(--seg-fill)',
      }}
      className={`
        absolute border-2 transition-[border-color,background-color] duration-75 group/seg
        ${isEditMode ? 'pointer-events-auto cursor-move' : 'pointer-events-none cursor-default'}
        ${isCandidate && isEditMode ? 'border-violet-600 ring-2 ring-violet-400/80 bg-violet-500/25 z-20 shadow-md' : ''}
        ${isSelected && !isCandidate && isEditMode ? 'border-purple-600 ring-2 ring-purple-400/80 bg-purple-500/20 z-20 shadow-md' : ''}
        ${isAbsorbed && isEditMode ? 'border-dashed border-amber-500 bg-amber-400/20 z-10' : ''}
      `}
    >
      {/* 상단 테두리와 겹치지 않도록 -top-5 에 띄우는 라벨 뱃지 */}
      <div
        style={{
          backgroundColor: 'var(--seg-badge-bg)',
          borderColor: 'var(--seg-badge-border)',
          color: 'var(--seg-badge-text)',
        }}
        className={`
          absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs border
          flex items-center gap-1 transition-transform duration-150 pointer-events-none z-20
          ${isHovered && isEditMode ? 'scale-105 shadow-md' : 'opacity-90'}
        `}
      >
        {isCandidate && (
          <span className="w-3.5 h-3.5 -ml-0.5 rounded-full bg-violet-600 text-white text-[8px] font-bold flex items-center justify-center">
            {candidateOrder}
          </span>
        )}
        <span className="uppercase text-[9px] opacity-85">{resolved.label}</span>
        <span className="max-w-[140px] truncate font-medium">{segment.label}</span>
        {isAbsorbed && <span className="text-[8px] font-bold text-amber-700">흡수</span>}
      </div>

      {showPanel && (
        <SegmentInfoPanel
          segment={segment}
          typeLabel={resolved.label}
          isSelected={isSelected}
          isEditing={isEditing}
          editingLabel={editingLabel}
          onStartEdit={() => onStartLabelEdit(segment)}
          onDelete={() => onDelete(segment.id)}
          onSplit={onSplit ? (axis) => onSplit(segment.id, axis) : undefined}
          onClose={onClearSelection}
          onEditingLabelChange={onEditingLabelChange}
          onSaveLabel={onSaveLabel}
          onCancelEdit={onCancelEdit}
          onChangeType={onChangeType}
        />
      )}

      {isSelected && isEditMode && (
        <SegmentResizeHandles
          onHandlePointerDown={(handle, e) => onStartDrag(handle, segment, e)}
        />
      )}
    </div>
  );
});
