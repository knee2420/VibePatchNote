import { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  X,
  ArrowUp,
  Sparkles,
  ChevronDown,
  FileDiff,
} from 'lucide-react';
import type { ChatMessageItem } from '../model/types';

interface IdeSecondarySidebarProps {
  messages: ChatMessageItem[];
  promptInput: string;
  onChangePromptInput: (val: string) => void;
  onSendPrompt: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isStreaming?: boolean;
  onClose: () => void;
}

const availableModels = [
  'Gemini 3.8 Flash High',
  'Gemini 3.1 Pro',
  'Gemini 3.5 Flash Lite',
  'Gemma 4 31B',
];

export function IdeSecondarySidebar({
  messages,
  promptInput,
  onChangePromptInput,
  onSendPrompt,
  selectedModel,
  onSelectModel,
  isStreaming = false,
  onClose,
}: IdeSecondarySidebarProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden text-slate-200 select-none z-10">
      {/* 1. 패널 상단 헤더 */}
      <div className="h-8.5 px-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 truncate">
            신규 엔진 테스트 전략 제안
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="New Chat Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="Session Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 대화 및 피드 영역 */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 font-sans text-xs select-text">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="font-bold text-slate-400 uppercase">
                {msg.sender === 'user' ? 'You' : 'Antigravity'}
              </span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-100'
                  : 'bg-slate-850/90 text-slate-200 border border-slate-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* 파일 변경 통계 배지 */}
              {msg.filesChanged && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <FileDiff className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {msg.filesChanged.count} files changed{' '}
                      <span className="text-emerald-400 font-mono">+{msg.filesChanged.additions}</span>{' '}
                      <span className="text-rose-400 font-mono">-{msg.filesChanged.deletions}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen((v) => !v)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-[11px] cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs py-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Antigravity Agent is reasoning...</span>
          </div>
        )}

        {/* 모의 Diff 검토 모달 오버레이 */}
        {isReviewOpen && (
          <div className="p-3 bg-slate-950 border border-indigo-900/60 rounded-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>Changes Overview</span>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              <div className="text-emerald-400">+ widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx</div>
              <div className="text-emerald-400">+ widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts</div>
              <div className="text-amber-400">M pages/editor-lab/ui/EditorLabPage.tsx</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 변경 사항 검토 액션 바 */}
      <div className="px-3.5 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span>0 Files With Changes</span>
        <button
          type="button"
          onClick={() => setIsReviewOpen((v) => !v)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium cursor-pointer"
        >
          Review Changes
        </button>
      </div>

      {/* 4. 인텔리전트 프롬프트 컴포저 */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2">
        <div className="relative bg-slate-800/90 rounded-xl border border-slate-700/80 p-2.5 space-y-2 focus-within:border-indigo-500 transition-colors">
          <textarea
            value={promptInput}
            onChange={(e) => onChangePromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendPrompt();
              }
            }}
            placeholder="Ask anything, @ to mention, / for actions"
            rows={2}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-sans leading-relaxed"
          />

          {/* 컴포저 하단 툴바 */}
          <div className="flex items-center justify-between pt-1 select-none">
            {/* 모델 셀렉터 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-700/60 cursor-pointer"
              >
                <span>+</span>
                <span className="font-medium text-slate-300">{selectedModel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-[11px]">
                  {availableModels.map((m) => (
                    <div
                      key={m}
                      onClick={() => {
                        onSelectModel(m);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`px-3 py-1.5 hover:bg-slate-700 cursor-pointer ${
                        m === selectedModel ? 'text-indigo-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 전송 버튼 */}
            <button
              type="button"
              onClick={onSendPrompt}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                promptInput.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-slate-750 text-slate-500 hover:text-slate-300'
              }`}
              title="Send Prompt (Enter)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
