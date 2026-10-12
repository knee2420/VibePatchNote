/**
 * @file useNodeLink.ts
 * @description 불릿 내부 링크: 주소(#/프로젝트ID/불릿ID) 만들기 및 그 주소로 들어왔을 때 해당 불릿으로 이동
 */

import { useEffect } from 'react';
import { type NodeId, type ProjectId, findNode } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

/** 이 불릿으로 곧장 들어오는 주소를 만든다. */
export function buildNodeLink(projectId: ProjectId, nodeId: NodeId): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/${encodeURIComponent(projectId)}/${encodeURIComponent(nodeId)}`;
}

function parseNodeLink(hash: string): { projectId: ProjectId; nodeId: NodeId | null } | null {
  const [, projectId, nodeId] = hash.replace(/^#/, '').split('/');
  if (!projectId) return null;
  return {
    projectId: decodeURIComponent(projectId),
    nodeId: nodeId ? decodeURIComponent(nodeId) : null,
  };
}

/**
 * 주소의 # 뒷부분이 가리키는 프로젝트·불릿으로 이동한다.
 * `ready` 가 참이 된 뒤(보관함을 연 뒤)와, 주소가 바뀔 때마다 적용한다.
 */
export function useNodeLinkNavigation(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const navigate = () => {
      const link = parseNodeLink(window.location.hash);
      if (!link) return;

      const { workspace, focusProject, setZoom } = useWorkspaceStore.getState();
      const project = workspace.projects[link.projectId];
      if (!project) return;

      focusProject(project.id);
      if (link.nodeId && findNode(project.rootNodes, link.nodeId)) {
        setZoom(link.nodeId);
      }
      // 한 번 이동한 뒤에는 주소를 비운다. (새로고침 때마다 같은 곳으로 되돌아가지 않도록)
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };

    navigate();
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [ready]);
}
