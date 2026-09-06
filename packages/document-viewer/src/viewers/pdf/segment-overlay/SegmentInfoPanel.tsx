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

const ACTION_BUTTON =
  'p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer';

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
      className="absolute left-full ml-3 top-0 z-50 min-w-[240px] max-w-[300px] rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3.5 shadow-xl shadow-slate-900/10 nodrag nopan pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-slate-800"
    >
      <div className="flex items-center justify-between gap-1 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${typeStyle.badgeBg} ${typeStyle.badgeText}`}
          >
            {segment.type}
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
            {segment.label}
          </span>
        </div>

        {isSelected && (
          <div className="flex items-center gap-0.5">
            {!isEditing && (
              <button
                onClick={onStartEdit}
                className={`${ACTION_BUTTON} hover:text-indigo-600`}
                title="라벨/타입 편집 (더블클릭)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className={`${ACTION_BUTTON} hover:text-rose-600 hover:bg-rose-50`}
              title="세그먼트 삭제 (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className={ACTION_BUTTON} title="선택 해제 (Esc)">
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
