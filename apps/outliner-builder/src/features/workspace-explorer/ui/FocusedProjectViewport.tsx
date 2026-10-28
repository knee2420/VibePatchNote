/**
 * @file FocusedProjectViewport.tsx
 * @description 단일 프로젝트의 불릿 트리를 집중 렌더링하는 에디터 뷰포트 레이아웃
 * FSD 원칙: 에디터 본문은 Slot(children)으로 수신한다.
 */

import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { OutlineHeader } from '@vibe/outliner/editor';

interface FocusedProjectViewportProps {
  children?: React.ReactNode;
  title: string;
  onUpdateTitle: (title: string) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const FocusedProjectViewport: React.FC<FocusedProjectViewportProps> = ({
  children,
  title,
  onUpdateTitle,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  return (
    <main className="wide-page flex-1 max-w-5xl w-full mx-auto px-6 sm:px-10 pt-6 pb-20 flex flex-col min-w-0">
      {/* 1. 상단 공통 아웃라인 컨트롤 헤더 (Breadcrumb + 동적 줌 HEAD + 뷰 전환) */}
      <OutlineHeader
        rootTitle={title}
        onUpdateRootTitle={onUpdateTitle}
        rootPlaceholder="스캐폴드 제목"
        zoomPlaceholder="불릿 제목"
        leading={
          onToggleSidebar && (
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
          )
        }
      />

      {/* 2. 아웃라인 트리 작업대 (불필요한 카드 테두리 없이 플랫하게 전개) */}
      <div className="flex-1 flex flex-col min-h-0 pt-1">{children}</div>
    </main>
  );
};

