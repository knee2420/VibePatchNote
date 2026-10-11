/**
 * @file OutlineTree.tsx
 * @description 평탄화된 아웃라인 노드들을 렌더링하는 컨테이너 컴포넌트
 */

import React, { useMemo } from 'react';
import { flattenTree } from '@vibe/outliner-core';
import { useTreeStore } from '@/entities/outline-document';
import { OutlineRow } from './OutlineRow';
import { Plus } from 'lucide-react';

export const OutlineTree: React.FC = () => {
  const rootNodes = useTreeStore((s) => s.document.rootNodes);
  const activeRootId = useTreeStore((s) => s.activeRootId);
  const appendChild = useTreeStore((s) => s.appendChild);

  // 줌인 상태에 맞춘 평탄화 노드 목록 계산
  const flattenedNodes = useMemo(() => {
    return flattenTree(rootNodes, activeRootId);
  }, [rootNodes, activeRootId]);

  if (flattenedNodes.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 text-sm mb-3">하위 아웃라인 항목이 비어있습니다.</p>
        <button
          type="button"
          onClick={() => {
            if (activeRootId) {
              appendChild(activeRootId, '');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>첫 번째 항목 생성하기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-0.5 py-2">
      {flattenedNodes.map((item) => (
        <OutlineRow
          key={item.id}
          item={item}
          flattenedNodes={flattenedNodes}
        />
      ))}
    </div>
  );
};
