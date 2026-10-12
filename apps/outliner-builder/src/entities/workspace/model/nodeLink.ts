/**
 * @file nodeLink.ts
 * @description 불릿 내부 링크의 주소 규칙: #/스캐폴드ID/불릿ID
 */

import type { NodeId, ProjectId } from '@vibe/outliner-core';

/** 이 불릿으로 곧장 들어오는 주소를 만든다. */
export function buildNodeLink(projectId: ProjectId, nodeId: NodeId): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/${encodeURIComponent(projectId)}/${encodeURIComponent(nodeId)}`;
}

export function parseNodeLink(
  hash: string
): { projectId: ProjectId; nodeId: NodeId | null } | null {
  const [, projectId, nodeId] = hash.replace(/^#/, '').split('/');
  if (!projectId) return null;
  return {
    projectId: decodeURIComponent(projectId),
    nodeId: nodeId ? decodeURIComponent(nodeId) : null,
  };
}
