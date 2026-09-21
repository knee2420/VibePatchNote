import {
  Files,
  Search,
  GitBranch,
  Play,
  Layers,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import type { IdeActivityBarProps, ActivityBarItemConfig } from './types';
import { IdeActivityBarItem, IdeActivityBarAction } from './primitives';

/** 기본 7대 IDE 액티비티 바 탭 프리셋 */
export const DEFAULT_ACTIVITY_BAR_ITEMS: ActivityBarItemConfig[] = [
  { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: <Files className="w-5 h-5" /> },
  { id: 'resources', label: 'Resource Manager (Ctrl+Shift+R)', icon: <FolderKanban className="w-5 h-5 text-amber-400" /> },
  { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: <Search className="w-5 h-5" /> },
  { id: 'sourceControl', label: 'Source Control (Ctrl+Shift+G)', icon: <GitBranch className="w-5 h-5" />, badge: '2' },
  { id: 'runDebug', label: 'Run & Debug (Ctrl+Shift+D)', icon: <Play className="w-5 h-5" /> },
  { id: 'recipes', label: 'Recipes (문서 저작 규격 속성)', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
  { id: 'antigravity', label: 'Antigravity AI Agent', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
];

/**
 * [IDE Mode] 데스크톱 IDE 스타일의 양측 액티비티 바 (Activity Bar).
 * 
 * - side='left': 좌측 메인 탐색기/리소스 탭 (border-r, 라인 인디케이터)
 * - side='right': 우측 보조 사이드바/AI 패널 (border-l, 라운드 박스, topSlot)
 * 
 * - `IdeActivityBar.Item`: 개별 탭 아이콘 버튼 (상태 기반 라디오)
 * - `IdeActivityBar.Action`: 하단 시스템 버튼 (일회성 트리거)
 */
export function IdeActivityBar<T extends string = string>({
  side = 'left',
  itemVariant = 'line',
  activeTab,
  onSelectTab,
  allowDeselect = false,
  items,
  topSlot,
  bottomActions,
  className = '',
}: IdeActivityBarProps<T>) {
  // 사용자가 items를 지정하지 않은 경우 기본 프리셋 사용
  const navItems = (items || DEFAULT_ACTIVITY_BAR_ITEMS) as ActivityBarItemConfig<T>[];

  const handleItemClick = (id: T) => {
    if (allowDeselect && activeTab === id) {
      onSelectTab(null);
    } else {
      onSelectTab(id);
    }
  };

  const borderClass = side === 'right' ? 'border-l border-slate-800/90' : 'border-r border-slate-800/80';
  const widthClass = side === 'right' ? 'w-11.5' : 'w-12';

  return (
    <aside
      className={`${widthClass} h-full bg-slate-950/95 ${borderClass} flex flex-col justify-between items-center py-2 shrink-0 select-none z-20 ${className}`}
    >
      {/* 1. 상단 슬롯 + 액티비티 탭 아이콘 목록 */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* 상단 커스텀 슬롯 (점수 서클, 프로필 배지 등) */}
        {topSlot && <div className="w-full flex flex-col items-center">{topSlot}</div>}

        {/* 탭 아이콘 목록 */}
        <div className={`flex flex-col items-center ${itemVariant === 'rounded' ? 'gap-1.5' : 'gap-2.5'} w-full`}>
          {navItems.map((item) => (
            <IdeActivityBarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              side={side}
              variant={itemVariant}
              isActive={activeTab === item.id}
              badge={item.badge}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </div>
      </div>

      {/* 2. 하단 시스템 액션 버튼 (Stateless Action Trigger 슬롯) */}
      {bottomActions ? (
        <div className="flex flex-col items-center gap-2 w-full">
          {bottomActions}
        </div>
      ) : null}
    </aside>
  );
}

// Compound Component 바인딩
IdeActivityBar.Item = IdeActivityBarItem;
IdeActivityBar.Action = IdeActivityBarAction;
