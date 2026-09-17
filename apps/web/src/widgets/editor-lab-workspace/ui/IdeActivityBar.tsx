import {
  Files,
  Search,
  GitBranch,
  Play,
  Layers,
  Sparkles,
  FolderKanban,
  User,
  Settings,
} from 'lucide-react';
import type { ActivityBarTab } from '../model/types';

interface IdeActivityBarProps {
  activeTab: ActivityBarTab;
  onSelectTab: (tab: ActivityBarTab) => void;
}

export function IdeActivityBar({
  activeTab,
  onSelectTab,
}: IdeActivityBarProps) {
  const topNavItems: { id: ActivityBarTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: <Files className="w-5 h-5" /> },
    { id: 'resources', label: 'Resource Manager (Ctrl+Shift+R)', icon: <FolderKanban className="w-5 h-5 text-amber-400" /> },
    { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: <Search className="w-5 h-5" /> },
    { id: 'sourceControl', label: 'Source Control (Ctrl+Shift+G)', icon: <GitBranch className="w-5 h-5" />, badge: '2' },
    { id: 'runDebug', label: 'Run & Debug (Ctrl+Shift+D)', icon: <Play className="w-5 h-5" /> },
    { id: 'recipes', label: 'Recipes (문서 저작 규격 속성)', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { id: 'antigravity', label: 'Antigravity AI Agent', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
  ];

  return (
    <aside className="w-12 h-full bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between items-center py-2 shrink-0 select-none z-20">
      {/* 1. 상단 액티비티 아이콘 목록 */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {topNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative w-full h-10 flex items-center justify-center transition-colors cursor-pointer group ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={item.label}
            >
              {/* 활성 인디케이터 바 */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-r" />
              )}
              {item.icon}

              {/* 배지 카운트 */}
              {item.badge && (
                <span className="absolute bottom-1.5 right-1.5 px-1 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. 하단 시스템 설정 아이콘 */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="button"
          className="w-full h-9 flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
          title="Accounts"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="w-full h-9 flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
          title="Settings (Ctrl+,)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
