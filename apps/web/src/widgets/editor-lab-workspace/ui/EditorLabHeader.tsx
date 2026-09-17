import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  PanelLeft,
  PanelRight,
  FileText,
  Layers,
  Sparkles,
  BookOpen,
  Maximize2,
} from 'lucide-react';

import {
  TopMenuBar,
  ViewModeSwitch,
  SyncStatusBadge,
  type PageLayoutMode,
  type ViewModeOption,
} from '@vibe/editor-workspace';

const viewModeOptions: ViewModeOption<PageLayoutMode>[] = [
  { id: 'continuous', label: '연속 스크롤', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'paged', label: 'A4 낱장', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'spread', label: '양면 펼침', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'zen', label: '젠 모드', icon: <Maximize2 className="w-3.5 h-3.5" /> },
];

interface EditorLabHeaderProps {
  layoutMode: PageLayoutMode;
  onChangeLayoutMode: (mode: PageLayoutMode) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onBack?: () => void;
}

export function EditorLabHeader({
  layoutMode,
  onChangeLayoutMode,
  showSidebar,
  onToggleSidebar,
  showInspector,
  onToggleInspector,
  onBack,
}: EditorLabHeaderProps) {
  return (
    <TopMenuBar
      leftSlot={
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="이전 화면으로 이동"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="대시보드로 이동"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              범용 시스템 기술 제안서
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Lab v2
            </span>
          </div>
        </div>
      }
      centerSlot={
        <ViewModeSwitch
          options={viewModeOptions}
          activeId={layoutMode}
          onChange={(mode) => onChangeLayoutMode(mode as PageLayoutMode)}
        />
      }
      rightSlot={
        <div className="flex items-center gap-2.5">
          <SyncStatusBadge status="saved" />
          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showSidebar
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="바인더 패널 토글"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleInspector}
            className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showInspector
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="AI 인스펙터 패널 토글"
          >
            <PanelRight className="w-4 h-4" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </button>
        </div>
      }
    />
  );
}
