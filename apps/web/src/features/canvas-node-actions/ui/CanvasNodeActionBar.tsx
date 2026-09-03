import { 
  LayoutGrid, 
  AlignHorizontalDistributeCenter, 
  AlignVerticalDistributeCenter, 
  Trash2, 
  X,
  Palette
} from 'lucide-react';

import { useNodeActions, type NodeTheme } from '../model/useNodeActions';

const THEME_OPTIONS: { id: NodeTheme; name: string; bgClass: string; borderClass: string }[] = [
  { id: 'default', name: '기본 (화이트)', bgClass: 'bg-white', borderClass: 'border-slate-300' },
  { id: 'yellow', name: '웜 옐로우', bgClass: 'bg-amber-200', borderClass: 'border-amber-400' },
  { id: 'green', name: '민트 그린', bgClass: 'bg-emerald-200', borderClass: 'border-emerald-400' },
  { id: 'blue', name: '스카이 블루', bgClass: 'bg-sky-200', borderClass: 'border-sky-400' },
  { id: 'purple', name: '라벤더 퍼플', bgClass: 'bg-purple-200', borderClass: 'border-purple-400' },
];

export function CanvasNodeActionBar() {
  const {
    hasSelection,
    selectedCount,
    arrangeInGrid,
    distributeHorizontally,
    distributeVertically,
    changeNodeTheme,
    deleteSelected,
    deselectAll,
  } = useNodeActions();

  if (!hasSelection) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200/90 rounded-2xl px-3.5 py-2 flex items-center gap-2 ring-1 ring-black/5">
        {/* 선택 카운터 뱃지 */}
        <div className="flex items-center gap-1.5 pl-1 pr-2 border-r border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
            {selectedCount}개 선택됨
          </span>
        </div>

        {/* 🔲 자동 그리드 정렬 (바둑판) */}
        <button
          onClick={arrangeInGrid}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="선택된 카드들을 바둑판 그리드로 자동 재배치합니다"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">그리드 정렬</span>
        </button>

        {/* ↔️ 수평 균등 배분 */}
        <button
          onClick={distributeHorizontally}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="선택된 카드들을 가로로 나란히 균등 배치합니다"
        >
          <AlignHorizontalDistributeCenter className="w-4 h-4" />
          <span className="hidden sm:inline">가로 배분</span>
        </button>

        {/* ↕️ 수직 균등 배분 */}
        <button
          onClick={distributeVertically}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="선택된 카드들을 세로로 나란히 균등 배치합니다"
        >
          <AlignVerticalDistributeCenter className="w-4 h-4" />
          <span className="hidden sm:inline">세로 배분</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* 🎨 카드 테마 색상 일괄 변경 */}
        <div className="flex items-center gap-1.5 px-1">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => changeNodeTheme(theme.id)}
              className={`w-5 h-5 rounded-full border shadow-xs transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-400 ${theme.bgClass} ${theme.borderClass}`}
              title={`${theme.name} 색상 적용`}
            />
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* 🗑️ 선택 카드 일괄 삭제 */}
        <button
          onClick={deleteSelected}
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          title="선택된 카드 일괄 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* ✕ 선택 해제 */}
        <button
          onClick={deselectAll}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
          title="선택 해제"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
