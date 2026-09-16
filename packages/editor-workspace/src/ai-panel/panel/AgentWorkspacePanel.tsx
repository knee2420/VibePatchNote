import { memo } from 'react';
import {
  Bot,
  Activity,
  GitCompare,
  ShieldCheck,
  History,
  Pin,
  X,
} from 'lucide-react';
import { PromptComposer } from '../composer/PromptComposer';
import { AgentStepStream } from '../execution/AgentStepStream';
import { DiffApprovalView } from '../approval/DiffApprovalView';
import { GroundingCitationBar } from '../grounding/GroundingCitationBar';
import { RunHistoryTimeline } from '../history/RunHistoryTimeline';
import type { AgentWorkspacePanelProps } from './types';

/**
 * AgentWorkspacePanel (도킹/슬라이딩 AI 워크스페이스 패널 종합 컴포넌트)
 *
 * 1. 하단 컨텍스트 하네스 & 프롬프트 컴포저 (PromptComposer)
 * 2. 단계별 추론 관측 스트림 (AgentStepStream)
 * 3. 휴먼-인-더-루프(HITL) Diff 승인기 (DiffApprovalView)
 * 4. 출처 역추적 및 그라운딩 검증기 (GroundingCitationBar)
 * 5. 생성 시도(Attempt) 타임라인 & 롤백 (RunHistoryTimeline)
 */
export const AgentWorkspacePanel = memo(function AgentWorkspacePanel({
  title = 'Agent Assistant',
  activeTab,
  onChangeTab,
  composerProps,
  steps = [],
  isExecuting = false,
  diffChunks = [],
  onAcceptChunk,
  onRejectChunk,
  onAcceptAllChunks,
  onRejectAllChunks,
  citations = [],
  groundingScore,
  missingStatements,
  onSelectCitation,
  attempts = [],
  activeAttemptId,
  onSelectAttempt,
  onForkBranch,
  onRollbackToAttempt,
  onClose,
  isPinned,
  onTogglePin,
  extraHeaderActions,
  className = '',
}: AgentWorkspacePanelProps) {
  const pendingDiffCount = diffChunks.filter((c) => c.status === 'pending').length;

  return (
    <div className={`flex flex-col h-full w-full bg-slate-950 text-slate-100 border-l border-slate-800 overflow-hidden ${className}`}>
      {/* 1. 패널 상단 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-bold text-xs text-slate-200">{title}</span>
          {isExecuting && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              Running
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {extraHeaderActions}
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? '패널 고정 해제' : '패널 고정'}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isPinned ? 'text-indigo-400 bg-indigo-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="패널 닫기"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 탭 네비게이션 바 */}
      <div className="flex items-center p-1 bg-slate-950 border-b border-slate-800 shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onChangeTab('stream')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none cursor-pointer ${
            activeTab === 'stream'
              ? 'bg-slate-800 text-indigo-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>추론 스트림</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('diff')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none cursor-pointer ${
            activeTab === 'diff'
              ? 'bg-slate-800 text-indigo-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GitCompare className="w-3 h-3" />
          <span>Diff 승인</span>
          {pendingDiffCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-950 text-indigo-300 font-bold">
              {pendingDiffCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('grounding')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none cursor-pointer ${
            activeTab === 'grounding'
              ? 'bg-slate-800 text-indigo-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>그라운딩 검증</span>
          {citations.length > 0 && (
            <span className="text-[10px] px-1 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
              {citations.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('history')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-800 text-indigo-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-3 h-3" />
          <span>실행 이력</span>
          {attempts.length > 0 && (
            <span className="text-[10px] px-1 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
              {attempts.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. 중앙 탭 본문 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
        {activeTab === 'stream' && (
          <AgentStepStream steps={steps} isLive={isExecuting} />
        )}

        {activeTab === 'diff' && (
          <DiffApprovalView
            chunks={diffChunks}
            onAcceptChunk={onAcceptChunk || (() => {})}
            onRejectChunk={onRejectChunk || (() => {})}
            onAcceptAll={onAcceptAllChunks}
            onRejectAll={onRejectAllChunks}
          />
        )}

        {activeTab === 'grounding' && (
          <GroundingCitationBar
            citations={citations}
            score={groundingScore}
            missingStatements={missingStatements}
            onSelectCitation={onSelectCitation}
          />
        )}

        {activeTab === 'history' && (
          <RunHistoryTimeline
            attempts={attempts}
            activeAttemptId={activeAttemptId || (attempts[0]?.id ?? '')}
            onSelectAttempt={onSelectAttempt || (() => {})}
            onForkBranch={onForkBranch}
            onRollbackToAttempt={onRollbackToAttempt}
          />
        )}
      </div>

      {/* 4. 하단 고정 프롬프트 컴포저 */}
      <div className="p-2 border-t border-slate-800 bg-slate-950 shrink-0">
        <PromptComposer {...composerProps} />
      </div>
    </div>
  );
});
