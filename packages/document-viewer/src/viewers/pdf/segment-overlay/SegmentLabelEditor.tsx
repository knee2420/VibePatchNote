import { Check } from 'lucide-react';

import type { ViewerSegment } from '../../../types';
import { SEGMENT_TYPE_OPTIONS } from './segmentTypeStyles';

interface SegmentLabelEditorProps {
  segment: ViewerSegment;
  editingLabel: string;
  onEditingLabelChange: (label: string) => void;
  onSaveLabel: () => void;
  onCancelEdit: () => void;
  onChangeType: (type: string) => void;
}

/** 라벨 텍스트와 블록 타입을 고치는 편집 폼. */
export function SegmentLabelEditor({
  segment,
  editingLabel,
  onEditingLabelChange,
  onSaveLabel,
  onCancelEdit,
  onChangeType,
}: SegmentLabelEditorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 bg-slate-50 focus-within:bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-xs">
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => onEditingLabelChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveLabel();
            else if (e.key === 'Escape') onCancelEdit();
          }}
          placeholder="라벨 입력..."
          className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium placeholder:text-slate-400"
          autoFocus
        />
        <button
          onClick={onSaveLabel}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded-md cursor-pointer transition-colors"
          title="저장 (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {SEGMENT_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChangeType(opt.id)}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              segment.type === opt.id
                ? `${opt.color} shadow-xs ring-2 ring-indigo-400/30 scale-105`
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {segment.content_summary && (
        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 line-clamp-3">
          {segment.content_summary}
        </p>
      )}
    </div>
  );
}
