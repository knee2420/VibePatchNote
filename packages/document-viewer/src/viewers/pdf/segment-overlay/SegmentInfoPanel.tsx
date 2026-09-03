import { Edit3, Trash2, X } from 'lucide-react';

import type { ViewerSegment } from '../../../types';
import { SegmentLabelEditor } from './SegmentLabelEditor';
import { SegmentSummaryView } from './SegmentSummaryView';
import type { SegmentTypeStyle } from './segmentTypeStyles';

interface SegmentInfoPanelProps {
  segment: ViewerSegment;
  typeStyle: SegmentTypeStyle;
  isSelected: boolean;
  isEditing: boolean;
  editingLabel: string;
  onStartEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onEditingLabelChange: (label: string) => void;
  onSaveLabel: () => void;
  onCancelEdit: () => void;
  onChangeType: (type: string) => void;
}

const ACTION_BUTTON = 'p-1 rounded text-slate-400 transition-colors cursor-pointer hover:bg-slate-800';

/**
 * 세그먼트 박스 우측 바깥에 뜨는 정보/편집 패널.
 * 호버 = 미리보기, 클릭 = 고정, 더블클릭 = 라벨·타입 편집.
 */
export function SegmentInfoPanel({
  segment,
  typeStyle,
  isSelected,
  isEditing,
  editingLabel,
  onStartEdit,
  onDelete,
  onClose,
  onEditingLabelChange,
  onSaveLabel,
  onCancelEdit,
  onChangeType,
}: SegmentInfoPanelProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
      }}
      className="absolute left-full ml-3 top-0 z-50 min-w-[240px] max-w-[300px] rounded-lg border border-slate-700 p-3 nodrag nopan pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-white"
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${typeStyle.badgeBg} ${typeStyle.badgeText}`}
          >
            {segment.type}
          </span>
          <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[130px]">
            {segment.label}
          </span>
        </div>

        {isSelected && (
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={onStartEdit}
                className={`${ACTION_BUTTON} hover:text-purple-300`}
                title="라벨/타입 편집 (더블클릭)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className={`${ACTION_BUTTON} hover:text-rose-400`}
              title="세그먼트 삭제 (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className={`${ACTION_BUTTON} hover:text-white`} title="선택 해제 (Esc)">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isSelected && isEditing ? (
        <SegmentLabelEditor
          segment={segment}
          editingLabel={editingLabel}
          onEditingLabelChange={onEditingLabelChange}
          onSaveLabel={onSaveLabel}
          onCancelEdit={onCancelEdit}
          onChangeType={onChangeType}
        />
      ) : (
        <SegmentSummaryView segment={segment} isSelected={isSelected} />
      )}
    </div>
  );
}
