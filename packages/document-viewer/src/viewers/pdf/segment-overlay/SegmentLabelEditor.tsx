import { Check } from 'lucide-react';

import { resolveSegmentType } from '../../../segmentTypes';
import type { ViewerSegment } from '../../../types';
import { useSegmentTypes, useViewerLabels } from '../../../viewerConfig';

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
  const labels = useViewerLabels();
  const segmentTypes = useSegmentTypes();
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
          placeholder={labels.labelPlaceholder}
          className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium placeholder:text-slate-400"
          autoFocus
        />
        <button
          onClick={onSaveLabel}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded-md cursor-pointer transition-colors"
          title={labels.saveLabel}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {segmentTypes.map((descriptor) => {
          const resolved = resolveSegmentType(descriptor.id, segmentTypes);
          const isActive = segment.type === descriptor.id;
          return (
            <button
              key={descriptor.id}
              onClick={() => onChangeType(descriptor.id)}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, ${resolved.color} 16%, white)`,
                      color: `color-mix(in srgb, ${resolved.color} 78%, black)`,
                      borderColor: `color-mix(in srgb, ${resolved.color} 40%, white)`,
                    }
                  : undefined
              }
              className={`px-2 py-1 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'shadow-xs scale-105'
                  : 'border-transparent bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              {resolved.label}
            </button>
          );
        })}
      </div>

      {segment.summary && (
        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 line-clamp-3">
          {segment.summary}
        </p>
      )}
    </div>
  );
}
