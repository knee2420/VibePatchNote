/**
 * @file useZoom.ts
 * @description 아웃라인 줌인/줌아웃 및 조상 빵가루 경로 계산 훅
 */

import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';
import { findNode, getPath } from '@vibe/outliner-core';

export function useZoom() {
  const rootNodes = useActiveProject().rootNodes;
  const activeRootId = useWorkspaceStore((s) => s.activeRootId);
  const setZoom = useWorkspaceStore((s) => s.setZoom);

  const activeNode = activeRootId ? findNode(rootNodes, activeRootId) : null;
  const breadcrumb = activeRootId ? getPath(rootNodes, activeRootId) : [];

  const zoomIn = (nodeId: string) => {
    setZoom(nodeId);
  };

  const zoomOut = () => {
    if (!activeRootId || breadcrumb.length <= 1) {
      setZoom(null);
      return;
    }
    const parent = breadcrumb[breadcrumb.length - 2];
    setZoom(parent ? parent.id : null);
  };

  const zoomToRoot = () => {
    setZoom(null);
  };

  return {
    activeRootId,
    activeNode,
    breadcrumb,
    isZoomed: activeRootId !== null,
    zoomIn,
    zoomOut,
    zoomToRoot,
  };
}
