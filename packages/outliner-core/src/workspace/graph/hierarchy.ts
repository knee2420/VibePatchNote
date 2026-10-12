/**
 * @file hierarchy.ts
 * @description 워크스페이스 내 프로젝트들의 부모-자식 계층 트리 빌더 순수 함수
 */

import type { Project, ProjectId } from '../model/types';

export interface HierarchicalProjectNode {
  project: Project;
  children: HierarchicalProjectNode[];
  depth: number;
}

/**
 * 평면 딕셔너리 projects를 부모-자식 계층 트리 목록으로 재구성한다.
 * parentProjectId 가 존재하고 유효한 부모가 워크스페이스에 있을 때만 자식으로 편입하며,
 * 부모가 없거나 삭제된 경우 최상위(루트) 노드로 안전 취급한다.
 */
export function buildProjectHierarchy(
  projects: Record<ProjectId, Project>
): HierarchicalProjectNode[] {
  const allProjects = Object.values(projects);
  const byParent: Record<string, Project[]> = {};

  for (const proj of allProjects) {
    const parentKey =
      proj.parentProjectId && projects[proj.parentProjectId]
        ? proj.parentProjectId
        : '__ROOT__';

    if (!byParent[parentKey]) {
      byParent[parentKey] = [];
    }
    byParent[parentKey].push(proj);
  }

  function buildNodes(parentKey: string, depth: number): HierarchicalProjectNode[] {
    const list = byParent[parentKey] ?? [];
    list.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

    return list.map((proj) => ({
      project: proj,
      children: buildNodes(proj.id, depth + 1),
      depth,
    }));
  }

  return buildNodes('__ROOT__', 0);
}
