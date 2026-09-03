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
      <div className="flex items-center gap-1 bg-slate-800/90 rounded px-2 py-1.5 border border-purple-500/50 focus-within:border-purple-400">
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => onEditingLabelChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveLabel();
            else if (e.key === 'Escape') onCancelEdit();
          }}
          placeholder="라벨 입력..."
          className="w-full bg-transparent text-xs text-white outline-none font-medium placeholder:text-slate-500"
          autoFocus
        />
        <button
          onClick={onSaveLabel}
          className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded cursor-pointer"
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
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              segment.type === opt.id
                ? `${opt.color} text-white shadow-xs ring-1 ring-white/40 scale-105`
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {segment.content_summary && (
        <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-800/50 p-2 rounded border border-slate-700/50 line-clamp-3">
          {segment.content_summary}
        </p>
      )}
    </div>
  );
}
