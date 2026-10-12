/**
 * @file forkProject.ts
 * @description 프로젝트 가상 분기(Fork) 순수 함수
 */

import { generateNodeId } from '../../outline/model/id';
import type { OutlineNode } from '../../outline/model/types';
import type { Project } from '../model/types';

/**
 * 모든 노드에 새로운 ID를 재귀적으로 재할당하여 완전히 독립된 복제본을 만든다.
 */
function cloneNodesWithNewIds(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.map((node) => ({
    ...node,
    id: generateNodeId(),
    children: cloneNodesWithNewIds(node.children),
  }));
}

/**
 * 기존 프로젝트를 기반으로 독립된 실험/분기 프로젝트를 생성한다.
 */
export function forkProject(
  sourceProject: Project,
  forkTitle?: string,
  parentProjectId?: string | null
): Project {
  const now = Date.now();
  const finalTitle = forkTitle ?? `${sourceProject.title} (분기)`;
  const resolvedParentId =
    parentProjectId !== undefined ? parentProjectId : sourceProject.id;

  return {
    id: generateNodeId(),
    title: finalTitle,
    parentProjectId: resolvedParentId,
    rootNodes: cloneNodesWithNewIds(sourceProject.rootNodes),
    defaultView: sourceProject.defaultView,
    meta: {
      ...sourceProject.meta,
      forkedFrom: {
        projectId: sourceProject.id,
        projectTitle: sourceProject.title,
        forkedAt: now,
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}
