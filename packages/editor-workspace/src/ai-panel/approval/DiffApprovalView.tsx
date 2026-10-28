import { memo, useState } from 'react';
import { CheckCheck, XCircle, Columns, AlignJustify } from 'lucide-react';
import { InlineDiffViewer } from './InlineDiffViewer';
import { ChunkActionGroup } from './ChunkActionGroup';
import { SafetyApprovalGate } from './SafetyApprovalGate';
import type { DiffApprovalViewProps } from './types';

/**
 * DiffApprovalView (휴먼-인-더-루프 HITL 전체 승인 뷰)
 *
 * AI 제안 변경사항을 인라인/분할 Diff로 대조하고, 단락별 선별 수락 및 일괄 승인을 처리합니다.
 */
export const DiffApprovalView = memo(function DiffApprovalView({
  chunks,
  onAcceptChunk,
  onRejectChunk,
  onEditChunk,
  onRetryChunk,
  onAcceptAll,
  onRejectAll,
  requireSafetyGate = false,
  safetyGateMessage,
  className = '',
  extraHeader,
}: DiffApprovalViewProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [showGate, setShowGate] = useState(requireSafetyGate);

  const pendingCount = chunks.filter((c) => c.status === 'pending').length;

  return (
    <div className={`flex flex-col gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs ${className}`}>
      {/* 1. 상단 승인 헤더 */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800">변경 제안 검토</span>
          {pendingCount > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
              {pendingCount}건 대기
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              검토 완료
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* 뷰 모드 토글 (Unified / Split) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              title="인라인 대조 뷰"
              className={`p-1 rounded-md transition-colors cursor-pointer ${viewMode === 'unified' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <AlignJustify className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              title="좌우 분할 대조 뷰"
              className={`p-1 rounded-md transition-colors cursor-pointer ${viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Columns className="w-3 h-3" />
            </button>
          </div>

          {/* 전체 수락 / 거절 */}
          {onAcceptAll && pendingCount > 0 && (
            <button
              type="button"
              onClick={onAcceptAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3 h-3" />
              <span>전체 수락</span>
            </button>
          )}

          {onRejectAll && pendingCount > 0 && (
            <button
              type="button"
              onClick={onRejectAll}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <XCircle className="w-3 h-3" />
              <span>전체 거절</span>
            </button>
          )}
        </div>
      </div>

      {extraHeader}

      {/* 2. 안전 승인 게이트 (필요 시) */}
      {showGate && (
        <SafetyApprovalGate
          title="고위험 문서 덮어쓰기 경고"
          description={safetyGateMessage || '현재 문서의 기존 섹션을 AI 제안 구조로 완전히 교체합니다.'}
          riskLevel="high"
          onConfirm={() => setShowGate(false)}
          onCancel={() => {
            setShowGate(false);
            onRejectAll?.();
          }}
        />
      )}

      {/* 3. 개별 Diff 청크 목록 */}
      <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1 no-scrollbar">
        {chunks.map((chunk) => (
          <div key={chunk.id} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-50/60 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs text-indigo-700 truncate">
                {chunk.sectionTitle || '문서 섹션'}
              </span>

              <ChunkActionGroup
                chunkId={chunk.id}
                status={chunk.status}
                onAccept={onAcceptChunk}
                onReject={onRejectChunk}
                onEdit={onEditChunk ? (id) => onEditChunk(id, chunk.proposedText) : undefined}
                onRetry={onRetryChunk}
              />
            </div>

            {chunk.reason && (
              <p className="text-[11px] text-slate-600 italic bg-white border border-slate-200/80 p-2 rounded-lg font-sans">
                💡 변경 의도: {chunk.reason}
              </p>
            )}

            <InlineDiffViewer
              originalText={chunk.originalText}
              proposedText={chunk.userModifiedText || chunk.proposedText}
              mode={viewMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
