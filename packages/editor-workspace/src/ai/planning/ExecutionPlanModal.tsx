import { memo, useState } from 'react';
import { Play, MessageSquare, X, CheckSquare, Square, FileSpreadsheet } from 'lucide-react';
import type { ExecutionPlanModalProps, PlanStepItem } from './types';

/**
 * ExecutionPlanModal (안티그래비티 실행 계획 뷰어 모달)
 *
 * 에이전트가 대규모 작업을 실행하기 전 제안한 단계별 계획서(Plan)를 검토하고 선별 승인합니다.
 */
export const ExecutionPlanModal = memo(function ExecutionPlanModal({
  isOpen,
  planTitle,
  overview,
  steps,
  onToggleStep,
  onProceed,
  onRequestChanges,
  onReject,
  onClose,
  className = '',
}: ExecutionPlanModalProps) {
  const [feedback, setFeedback] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  if (!isOpen) return null;

  const selectedSteps = steps.filter((s) => s.isSelected !== false);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 ${className}`}>
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] text-xs text-slate-800">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">{planTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 개요 & 스텝 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {/* 개요 설명 */}
          {overview && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-sans shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">
                Plan Overview:
              </span>
              {overview}
            </div>
          )}

          {/* 세부 실행 단계 체크리스트 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-semibold px-1">
              <span>세부 실행 단계 ({selectedSteps.length}/{steps.length} 선택됨)</span>
            </div>

            <div className="space-y-1.5">
              {steps.map((step: PlanStepItem) => {
                const isSelected = step.isSelected !== false;
                return (
                  <div
                    key={step.id}
                    onClick={() => onToggleStep?.(step.id)}
                    className={`
                      flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer select-none
                      ${
                        isSelected
                          ? 'bg-white border-indigo-400 text-slate-900 shadow-xs ring-1 ring-indigo-500/20'
                          : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-70'
                      }
                    `}
                  >
                    <button type="button" className="mt-0.5 text-indigo-600 shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-800">
                          Step {step.stepNumber}: {step.title}
                        </span>
                        {step.estimatedTokens && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ~{step.estimatedTokens} tokens
                          </span>
                        )}
                      </div>

                      {step.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      )}

                      {step.targetSlots && step.targetSlots.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {step.targetSlots.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 수정 피드백 입력창 (토글 시) */}
          {isFeedbackOpen && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2 animate-in fade-in duration-100 shadow-2xs">
              <span className="text-xs font-semibold text-indigo-700">계획 수정 지시사항:</span>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="어떤 단계를 수정하거나 추가/삭제해야 하는지 작성하세요..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs placeholder-slate-400"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="px-2.5 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!feedback.trim()}
                  onClick={() => onRequestChanges?.(feedback.trim())}
                  className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white cursor-pointer shadow-xs"
                >
                  수정 요청 전송
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 풋터 액션 바 */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-200 bg-slate-50/70">
          <button
            type="button"
            onClick={onReject}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            계획 거절
          </button>

          <div className="flex items-center gap-2">
            {!isFeedbackOpen && onRequestChanges && (
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>계획 수정 요청</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onProceed(selectedSteps)}
              disabled={selectedSteps.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>선택 단계 승인 및 실행 ({selectedSteps.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
