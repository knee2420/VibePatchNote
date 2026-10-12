/**
 * @file FocusedProjectViewport.tsx
 * @description 단일 프로젝트의 불릿 트리를 집중 렌더링하는 에디터 뷰포트 레이아웃
 * FSD 원칙: 에디터 본문은 Slot(children)으로 수신한다.
 */

import React from 'react';
import { LayoutGrid, List, PanelLeftClose, PanelLeft } from 'lucide-react';

interface FocusedProjectViewportProps {
  children?: React.ReactNode;
  title: string;
  onUpdateTitle: (title: string) => void;
  defaultView?: 'bullets' | 'board';
  onToggleViewMode?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const FocusedProjectViewport: React.FC<FocusedProjectViewportProps> = ({
  children,
  title,
  onUpdateTitle,
  defaultView = 'bullets',
  onToggleViewMode,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  return (
    <main className="wide-page flex-1 max-w-5xl w-full mx-auto px-6 sm:px-10 pt-6 pb-20 flex flex-col min-w-0">
      {/* 1. 상단 프로젝트 컨트롤 헤더 */}
      <div className="mb-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-(--background-modifier-border)/50">
        <div className="flex items-center gap-2 min-w-0">
          {/* 사이드바 토글 버튼 */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
              className="p-1.5 rounded-lg bg-(--background-secondary) border border-(--background-modifier-border) hover:border-(--background-modifier-border-hover) hover:bg-(--background-modifier-hover) text-(--text-muted) hover:text-(--text-normal) text-xs transition-colors cursor-pointer shrink-0"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4 text-(--interactive-accent)" />
              )}
            </button>
          )}

          {/* 프로젝트 제목 인라인 편집 (Workflowy 풍 볼드 헤딩) */}
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="스캐폴드 제목"
            className="text-xl sm:text-2xl font-bold font-[var(--font-text-theme)] tracking-tight bg-transparent text-(--text-normal) hover:bg-(--background-modifier-hover) focus:bg-(--background-secondary) px-2 py-0.5 rounded-md border border-transparent focus:border-(--interactive-accent) focus:outline-hidden transition-all truncate min-w-0"
          />
        </div>

        {/* 우측 뷰 모드 토글 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 뷰 모드 토글 버튼 (불릿 vs 보드) */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              title={`현재: ${defaultView === 'board' ? '칸반 보드 뷰' : '불릿 아웃라인 뷰'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-(--background-secondary) border border-(--background-modifier-border) hover:border-(--background-modifier-border-hover) text-(--text-muted) hover:text-(--text-normal) text-xs transition-colors cursor-pointer"
            >
              {defaultView === 'board' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-(--interactive-accent)" />
                  <span className="hidden sm:inline">보드 뷰</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5 text-(--interactive-accent)" />
                  <span className="hidden sm:inline">불릿 뷰</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. 아웃라인 트리 작업대 (불필요한 카드 테두리 없이 플랫하게 전개) */}
      <div className="flex-1 flex flex-col min-h-0 pt-1">
        {children}
      </div>
    </main>
  );
};
