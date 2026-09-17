import { useState } from 'react';
import {
  PanelLeft,
  PanelBottom,
  PanelRight,
  FolderKanban,
  Minus,
  Square,
  X,
  Sparkles,
} from 'lucide-react';

interface IdeWindowHeaderProps {
  activeFileName?: string;
  showPrimarySidebar: boolean;
  onTogglePrimarySidebar: () => void;
  showBottomPanel: boolean;
  onToggleBottomPanel: () => void;
  showResourceManager: boolean;
  onToggleResourceManager: () => void;
  showSecondarySidebar: boolean;
  onToggleSecondarySidebar: () => void;
  onBack?: () => void;
}

const menuItems = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

export function IdeWindowHeader({
  activeFileName = 'EditorLabPage.tsx',
  showPrimarySidebar,
  onTogglePrimarySidebar,
  showBottomPanel,
  onToggleBottomPanel,
  showResourceManager,
  onToggleResourceManager,
  showSecondarySidebar,
  onToggleSecondarySidebar,
}: IdeWindowHeaderProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <header className="h-8.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 text-xs select-none text-slate-300 shrink-0 z-30">
      {/* 1. 좌측 윈도우 메뉴 바 */}
      <div className="flex items-center gap-1">
        {/* Antigravity 로고 */}
        <div className="flex items-center gap-1.5 mr-2 font-bold text-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] tracking-wide">AGY</span>
        </div>

        {menuItems.map((item) => (
          <div key={item} className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === item ? null : item)}
              className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                activeMenu === item
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {item}
            </button>

            {/* 모의 드롭다운 메뉴 */}
            {activeMenu === item && (
              <div
                className="absolute left-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-50 text-[11px] text-slate-200"
                onClick={() => setActiveMenu(null)}
              >
                <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                  <span>New File</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ctrl+N</span>
                </div>
                <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                  <span>Save</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
                </div>
                <div className="h-[1px] bg-slate-700 my-1" />
                <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                  <span>Preferences</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ctrl+,</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. 중앙 타이틀 */}
      <div className="text-[11px] text-slate-400 font-medium truncate max-w-md hidden md:block">
        VibePatchNote - Antigravity IDE - <span className="text-slate-200">{activeFileName}</span>
      </div>

      {/* 3. 우측 레이아웃 토글 및 창 컨트롤 */}
      <div className="flex items-center gap-1.5">
        {/* 사이드바 및 패널 제어 3형제 버튼 */}
        <button
          type="button"
          onClick={onTogglePrimarySidebar}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showPrimarySidebar
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="좌측 탐색기 패널 토글"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleBottomPanel}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showBottomPanel
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="하단 터미널 패널 토글"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>

        {/* 리소스 매니저 패널 토글 버튼 (사용자 지정 위치) */}
        <button
          type="button"
          onClick={onToggleResourceManager}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showResourceManager
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="리소스 매니저 패널 토글 (Ctrl+Shift+R)"
        >
          <FolderKanban className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleSecondarySidebar}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showSecondarySidebar
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="우측 AI 패널 토글"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-[1px] bg-slate-800 mx-1" />

        {/* 윈도우 OS 버튼 (최소화, 최대화, 닫기) */}
        <button
          type="button"
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          title="최소화"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          title="최대화"
        >
          <Square className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded cursor-pointer"
          title="닫기"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
}
