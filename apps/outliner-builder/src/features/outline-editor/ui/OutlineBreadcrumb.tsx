/**
 * @file OutlineBreadcrumb.tsx
 * @description 상단 조상 경로(Breadcrumb) 네비게이션 UI 컴포넌트
 */

import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { useZoom } from '../model/useZoom';

export const OutlineBreadcrumb: React.FC = () => {
  const { isZoomed, breadcrumb, zoomIn, zoomToRoot } = useZoom();

  if (!isZoomed) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
          <Home className="w-3.5 h-3.5 text-indigo-400" />
          <span>전체 아웃라인 (Root)</span>
        </span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 py-2 px-1 text-xs text-slate-400 overflow-x-auto">
      <button
        type="button"
        onClick={zoomToRoot}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/80 hover:text-slate-200 transition-colors text-slate-400 cursor-pointer"
        title="최상위 전체 보기로 이동"
      >
        <Home className="w-3.5 h-3.5 text-indigo-400" />
        <span>Home</span>
      </button>

      {breadcrumb.map((node, index) => {
        const isLast = index === breadcrumb.length - 1;
        return (
          <React.Fragment key={node.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              type="button"
              onClick={() => zoomIn(node.id)}
              className={`px-2 py-1 rounded transition-colors truncate max-w-[200px] cursor-pointer ${
                isLast
                  ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 font-semibold shadow-sm'
                  : 'hover:bg-slate-800/80 hover:text-slate-200 text-slate-400'
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
