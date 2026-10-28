/**
 * @file useOutlineView.ts
 * @description 지금 화면을 불릿으로 볼지 보드로 볼지 결정하는 훅
 *
 * 줌인한 불릿에 보기 방식이 지정돼 있으면 그것을 따르고("보드로 바꾼 불릿"),
 * 없으면 스캐폴드의 기본 보기 방식을 따른다.
 */

import { useCallback } from 'react';
import { type ViewMode, findNode } from '../../core';
import { useEditorStore, useOutlineDefaultView, useOutlineRoots } from '../session/context';

export function useOutlineView() {
  const rootNodes = useOutlineRoots();
  const defaultView = useOutlineDefaultView();
  const activeRootId = useEditorStore((s) => s.activeRootId);
  const setDefaultView = useEditorStore((s) => s.setDefaultView);
  const setNodesViewMode = useEditorStore((s) => s.setNodesViewMode);

  const zoomedNode = activeRootId ? findNode(rootNodes, activeRootId) : null;
  const view: ViewMode = zoomedNode?.viewMode ?? defaultView ?? 'bullets';

  // 줌인한 상태에서 바꾸면 그 불릿의 보기 방식만, 아니면 스캐폴드의 기본 보기 방식을 바꾼다.
  const toggleView = useCallback(() => {
    const next: ViewMode = view === 'bullets' ? 'board' : 'bullets';
    if (zoomedNode) setNodesViewMode([zoomedNode.id], next);
    else setDefaultView(next);
  }, [view, zoomedNode, setNodesViewMode, setDefaultView]);

  return { view, toggleView };
}
