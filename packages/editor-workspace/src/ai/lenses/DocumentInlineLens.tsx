import { memo } from 'react';
import { Sparkles, ShieldCheck, Table, FileText } from 'lucide-react';
import type { DocumentInlineLensProps, DocumentLensAction } from './types';

const DEFAULT_LENS_ACTIONS: DocumentLensAction[] = [
  { id: 'distill', label: '세그먼트 합성', icon: <Sparkles className="w-2.5 h-2.5 text-indigo-600" /> },
  { id: 'factcheck', label: '원문 팩트체크', icon: <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> },
  { id: 'to_table', label: '표 변환', icon: <Table className="w-2.5 h-2.5 text-blue-600" /> },
  { id: 'summarize', label: '분량 맞춤', icon: <FileText className="w-2.5 h-2.5 text-amber-600" /> },
];

/**
 * DocumentInlineLens (안티그래비티 스타일 인라인 문서 렌즈)
 *
 * 에디터의 슬롯이나 단락 상단에 은은하게 노출되는 플로팅 액션 바.
 * 원클릭으로 해당 영역에 특화된 AI 파이프라인을 트리거합니다.
 */
export const DocumentInlineLens = memo(function DocumentInlineLens({
  actions = DEFAULT_LENS_ACTIONS,
  onTriggerAction,
  slotNumber,
  className = '',
}: DocumentInlineLensProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md bg-white/95 hover:bg-white border border-slate-200 shadow-xs backdrop-blur-xs text-[11px] font-mono text-slate-600 select-none transition-all ${className}`}>
      {slotNumber !== undefined && (
        <span className="font-bold text-indigo-600 mr-0.5">#{slotNumber}</span>
      )}

      <span className="text-slate-400 font-sans font-medium">AI Lens:</span>

      <div className="flex items-center gap-1">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => onTriggerAction(act.id)}
            title={act.tooltip || act.label}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 font-sans transition-colors cursor-pointer"
          >
            {act.icon}
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
