import { memo } from 'react';
import { Lightbulb, X, Wand2 } from 'lucide-react';
import type { DiagnosticQuickFixProps } from './types';

/**
 * DiagnosticQuickFix (안티그래비티 Diagnostic Auto-Fix 전구 퀵픽스)
 *
 * 바인더 소켓 충돌이나 슬롯 규격 미달 발생 시, 노드 옆에 나타나 원클릭으로 AI 해결책을 제안/수복합니다.
 */
export const DiagnosticQuickFix = memo(function DiagnosticQuickFix({
  issueType,
  issueMessage,
  suggestedActionLabel = 'AI 자동 수복 (Quick Fix)',
  onApplyFix,
  onDismiss,
  className = '',
}: DiagnosticQuickFixProps) {
  const getTheme = () => {
    switch (issueType) {
      case 'conflict':
        return 'bg-rose-950/80 border-rose-700/80 text-rose-200';
      case 'empty':
        return 'bg-indigo-950/80 border-indigo-700/80 text-indigo-200';
      case 'unverified':
      case 'length_exceeded':
      default:
        return 'bg-amber-950/80 border-amber-700/80 text-amber-200';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 p-1.5 px-2.5 rounded-lg border shadow-lg text-xs font-sans animate-in fade-in slide-in-from-top-1 duration-150 ${getTheme()} ${className}`}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
        <span className="truncate max-w-[200px]" title={issueMessage}>
          {issueMessage}
        </span>
      </div>

      <button
        type="button"
        onClick={onApplyFix}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0 shadow-xs"
      >
        <Wand2 className="w-2.5 h-2.5" />
        <span>{suggestedActionLabel}</span>
      </button>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-black/20 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});
