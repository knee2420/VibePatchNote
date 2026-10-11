/**
 * @file OutlineBullet.tsx
 * @description 아웃라인 불릿 점(•) 및 접기/펼치기 화살표 토글 UI
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface OutlineBulletProps {
  hasChildren: boolean;
  isFolded: boolean;
  onToggleFold: () => void;
  onZoom: () => void;
}

export const OutlineBullet: React.FC<OutlineBulletProps> = ({
  hasChildren,
  isFolded,
  onToggleFold,
  onZoom,
}) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0 select-none group/bullet">
      {/* 1. 접기/펼치기 화살표 */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFold();
        }}
        className={`w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 transition-transform cursor-pointer ${
          hasChildren ? 'opacity-0 group-hover/bullet:opacity-100' : 'opacity-0 pointer-events-none'
        } ${!isFolded ? 'rotate-90' : ''}`}
        title={isFolded ? '펼치기' : '접기'}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 2. 불릿 점 (클릭 시 줌인) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onZoom();
        }}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors cursor-pointer group/dot"
        title="이 노드로 줌인(Zoom-in)"
      >
        <span
          className={`rounded-full transition-all ${
            hasChildren && isFolded
              ? 'w-3 h-3 bg-indigo-500 ring-2 ring-indigo-400/30'
              : hasChildren
              ? 'w-2.5 h-2.5 bg-slate-400 ring-1 ring-slate-500 group-hover/dot:bg-indigo-400'
              : 'w-1.5 h-1.5 bg-slate-500 group-hover/dot:bg-indigo-400'
          }`}
        />
      </button>
    </div>
  );
};
