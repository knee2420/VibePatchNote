/**
 * @file OutlineRow.tsx
 * @description 들여쓰기 패딩 + 불릿 점 + 텍스트 인풋을 결합한 아웃라인 한 줄 뷰
 */

import React from 'react';
import type { FlattenedNode } from '@vibe/outliner-core';
import { OutlineBullet } from './OutlineBullet';
import { OutlineInput } from './OutlineInput';
import { useKeyOrchestrator } from '../model/useKeyOrchestrator';
import { useTreeStore } from '@/entities/outline-document';
import { useZoom } from '../model/useZoom';

interface OutlineRowProps {
  item: FlattenedNode;
  flattenedNodes: FlattenedNode[];
}

export const OutlineRow: React.FC<OutlineRowProps> = ({ item, flattenedNodes }) => {
  const toggleFold = useTreeStore((s) => s.toggleFold);
  const { zoomIn } = useZoom();
  const { handleKeyDown } = useKeyOrchestrator(item.id, flattenedNodes);

  return (
    <div
      className="group/row flex items-start py-0.5 relative hover:bg-slate-900/30 rounded transition-colors"
      style={{ paddingLeft: `${item.depth * 24}px` }}
      data-node-id={item.id}
    >
      {/* 1. 들여쓰기 세로 가이드선 (depth > 0) */}
      {item.depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-slate-800/60 pointer-events-none group-hover/row:bg-slate-700/60"
          style={{ left: `${(item.depth - 1) * 24 + 18}px` }}
        />
      )}

      {/* 2. 불릿 점 및 토글 */}
      <div className="pt-1.5">
        <OutlineBullet
          hasChildren={item.hasChildren}
          isFolded={item.isFolded}
          onToggleFold={() => toggleFold(item.id)}
          onZoom={() => zoomIn(item.id)}
        />
      </div>

      {/* 3. 텍스트 입력 에디터 */}
      <div className="flex-1 flex items-center min-w-0">
        <OutlineInput
          nodeId={item.id}
          initialText={item.node.text}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
