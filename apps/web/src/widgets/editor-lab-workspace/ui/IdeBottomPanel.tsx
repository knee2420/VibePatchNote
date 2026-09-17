import { useState } from 'react';
import {
  Plus,
  Trash2,
  Maximize2,
  X,
  Terminal,
} from 'lucide-react';
import type { BottomPanelTab, TerminalSessionItem } from '../model/types';

interface IdeBottomPanelProps {
  activeTab: BottomPanelTab;
  onSelectTab: (tab: BottomPanelTab) => void;
  sessions: TerminalSessionItem[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  commandInput: string;
  onChangeCommandInput: (val: string) => void;
  onSubmitCommand: (e?: React.FormEvent) => void;
  onClose: () => void;
}

export function IdeBottomPanel({
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onAddSession,
  commandInput,
  onChangeCommandInput,
  onSubmitCommand,
  onClose,
}: IdeBottomPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const tabs: { id: BottomPanelTab; label: string; count?: number }[] = [
    { id: 'problems', label: 'Problems', count: 0 },
    { id: 'output', label: 'Output' },
    { id: 'debugConsole', label: 'Debug Console' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'ports', label: 'Ports' },
  ];

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <div
      style={{ height: isMaximized ? '75%' : '230px' }}
      className="w-full bg-slate-950 border-t border-slate-800 flex flex-col overflow-hidden shrink-0 select-none text-slate-300 font-sans z-10 transition-all"
    >
      {/* 1. 패널 탭 헤더 */}
      <div className="h-8 px-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        {/* 좌측 카테고리 탭 목록 */}
        <div className="flex items-center gap-4 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 py-1 uppercase text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  isActive
                    ? 'text-white border-b-2 border-indigo-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 우측 툴바 액션 */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={onAddSession}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="New Terminal (Ctrl+Shift+`)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSubmitCommand()}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
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

      {/* 2. 패널 본문 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* [A] Terminal 탭 */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex overflow-hidden">
            {/* 터미널 CLI 스크린 */}
            <div className="flex-1 p-3 font-mono text-xs text-slate-300 overflow-y-auto flex flex-col justify-between select-text leading-5 bg-slate-950">
              <div className="space-y-1">
                {activeSession.history.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.startsWith('PS')
                        ? 'text-indigo-300 font-semibold'
                        : line.includes('INFO') || line.includes('Local')
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>

              {/* 대화형 터미널 입력창 */}
              <form onSubmit={onSubmitCommand} className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-900">
                <span className="text-indigo-400 font-semibold shrink-0">PS C:\AI_Projects\WebNovelAssistant\VibePatchNote&gt;</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => onChangeCommandInput(e.target.value)}
                  placeholder="Type a command (e.g. pnpm lint, pnpm typecheck, clear)..."
                  className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs"
                />
              </form>
            </div>

            {/* 터미널 세션 목록 사이드바 */}
            <div className="w-36 bg-slate-900 border-l border-slate-800/80 p-1 flex flex-col gap-0.5 shrink-0 select-none">
              {sessions.map((sess) => {
                const isSelected = sess.id === activeSessionId;
                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => onSelectSession(sess.id)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{sess.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* [B] Problems 탭 */}
        {activeTab === 'problems' && (
          <div className="p-4 text-xs text-slate-400 flex items-center justify-center w-full">
            No problems have been detected in the workspace.
          </div>
        )}

        {/* [C] Output 탭 (문서 빌드 & 컴파일 파이프라인 런타임) */}
        {activeTab === 'output' && (
          <div className="p-3 text-xs text-slate-300 font-mono space-y-1.5 overflow-y-auto">
            <div className="text-slate-500">[2026-09-17 20:15:00] [DocumentPipeline] Initializing Document Scaffold Engine v1.0</div>
            <div className="text-indigo-400">[Pipeline:Build] Target: 회의비 사용 내역 (scaffold-1a0a0008250)</div>
            <div className="text-slate-400">├── [Step 1] Loading Recipe: 11월 디딤돌 회의록.pdf (recipe-1a09fffe0a2) ... OK</div>
            <div className="text-slate-400">├── [Step 2] Binding 14 SSOT Slots to Canvas DOM ... 14/14 mapped</div>
            <div className="text-slate-400">├── [Step 3] Validating 2D Layout & A4 (595x842pt) Overflow ... 0 overflow errors</div>
            <div className="text-cyan-400">├── [Step 4] Checking Calculations: ₩40,000 + ₩29,000 = ₩69,000 (100% matched)</div>
            <div className="text-slate-400">└── [Step 5] Rendering PDF/A-1b Print Artifacts ... Success (2 Pages, 1.18 MB)</div>
            <div className="text-emerald-400 font-bold pt-1">✔ Document Build Completed in 342ms with 0 errors, 2 diagnostics warnings.</div>
          </div>
        )}

        {/* [D] Ports 탭 */}
        {activeTab === 'ports' && (
          <div className="p-3 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-slate-400">
              <span>Port</span>
              <span>Process</span>
              <span>Address</span>
            </div>
            <div className="flex items-center justify-between font-mono text-slate-300">
              <span>5173</span>
              <span>vite</span>
              <span>http://localhost:5173</span>
            </div>
            <div className="flex items-center justify-between font-mono text-slate-300">
              <span>8000</span>
              <span>uvicorn (fastapi)</span>
              <span>http://localhost:8000</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
