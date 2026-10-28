/**
 * @file OutlineBreadcrumb.tsx
 * @description 상단 조상 경로(Breadcrumb) 네비게이션 UI 컴포넌트
 */

import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { useZoom } from '../model/useZoom';

export interface OutlineBreadcrumbProps {
  className?: string;
}

export const OutlineBreadcrumb: React.FC<OutlineBreadcrumbProps> = ({
  className = 'mb-3',
}) => {
  const { isZoomed, breadcrumb, zoomIn, zoomToRoot } = useZoom();

  // 최상위 전체 보기 상태에서는 불필요한 Root 안내 배너를 숨겨 Workflowy처럼 깔끔하게 유지
  if (!isZoomed) {
    return null;
  }

  return (
    <nav className={`flex items-center gap-1.5 py-1 text-xs text-(--text-muted) overflow-x-auto select-none ${className}`}>
      <button
        type="button"
        onClick={zoomToRoot}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-(--background-modifier-hover) hover:text-(--text-normal) transition-colors cursor-pointer"
        title="최상위 전체 보기로 이동"
      >
        <Home className="w-3.5 h-3.5 text-(--interactive-accent)" />
        <span>Home</span>
      </button>

      {breadcrumb.map((node, index) => {
        const isLast = index === breadcrumb.length - 1;
        return (
          <React.Fragment key={node.id}>
            <ChevronRight className="w-3 h-3 text-(--text-faint) shrink-0" />
            <button
              type="button"
              onClick={() => zoomIn(node.id)}
              className={`px-1.5 py-0.5 rounded transition-colors truncate max-w-[200px] cursor-pointer ${
                isLast
                  ? 'text-(--text-normal) font-semibold'
                  : 'hover:bg-(--background-modifier-hover) hover:text-(--text-normal) text-(--text-muted)'
              }`}
              title={node.text || '제목 없음'}
            >
              {node.text || '제목 없음'}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
