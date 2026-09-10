import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ProviderStatusBadge } from '@/entities/llm-configuration';
import { PendingAgreementsPopover } from '@/features/agent-run-panel';
import { CanvasSettingsPopover } from '@/features/canvas-settings';
import { requestLlmSettings } from '@/shared/lib/llmSettingsEvent';

import { BoardTitleEditor } from './BoardTitleEditor';

interface BoardHeaderProps {
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSessionSheet: () => void;
  onClearSession: () => void;
}

/** 보드 상단 바: 대시보드 복귀 / 세션 제목 / 업로드 상태 / 환경 설정. */
export function BoardHeader({
  isUploading,
  fileInputRef,
  onFileChange,
  onOpenSessionSheet,
  onClearSession,
}: BoardHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b px-4 py-2.5 flex justify-between items-center z-10 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1.5 rounded-lg text-xs font-medium transition"
          title="대시보드로 돌아가기"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-semibold">대시보드</span>
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-tight">Hybrid Editing Board</h1>
          <div className="flex items-center gap-2">
            <BoardTitleEditor />
            <button
              onClick={onOpenSessionSheet}
              className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] rounded hover:bg-blue-100 transition font-medium"
            >
              세션 목록
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} />

        {isUploading && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md animate-pulse font-medium border border-blue-100">
            업로드 중...
          </span>
        )}

        {/* AI 공급자 상태. 정상이면 아이콘만, 막히면 이유까지 펼칩니다. */}
        <ProviderStatusBadge onOpenSettings={requestLlmSettings} />

        {/* 사람의 결정을 기다리는 실행. 보류는 실패가 아니므로 따로 보여 줍니다. */}
        <PendingAgreementsPopover />

        {/* Obsidian Style View & Environment Settings Popover */}
        <CanvasSettingsPopover onClearSession={onClearSession} />
      </div>
    </div>
  );
}
