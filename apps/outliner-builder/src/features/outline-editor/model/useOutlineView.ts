/**
 * @file useOutlineView.ts
 * @description 지금 화면을 불릿으로 볼지 보드로 볼지 결정하는 훅
 *
 * 줌인한 불릿에 보기 방식이 지정돼 있으면 그것을 따르고("보드로 바꾼 불릿"),
 * 없으면 프로젝트의 기본 보기 방식을 따른다.
 */

import { useCallback } from 'react';
import { type ViewMode, findNode } from '@vibe/outliner-core';
import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';

export function useOutlineView() {
  const project = useActiveProject();
  const activeRootId = useWorkspaceStore((s) => s.activeRootId);
  const setActiveProjectView = useWorkspaceStore((s) => s.setActiveProjectView);
  const setNodesViewMode = useWorkspaceStore((s) => s.setNodesViewMode);

  const zoomedNode = activeRootId ? findNode(project.rootNodes, activeRootId) : null;
  const view: ViewMode = zoomedNode?.viewMode ?? project.defaultView ?? 'bullets';

  // 줌인한 상태에서 바꾸면 그 불릿의 보기 방식만, 아니면 프로젝트 기본 보기 방식을 바꾼다.
  const toggleView = useCallback(() => {
    const next: ViewMode = view === 'bullets' ? 'board' : 'bullets';
    if (zoomedNode) setNodesViewMode([zoomedNode.id], next);
    else setActiveProjectView(next);
  }, [view, zoomedNode, setNodesViewMode, setActiveProjectView]);

  return { view, toggleView };
}
