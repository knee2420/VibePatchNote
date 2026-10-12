/**
 * @file workspaceOperations.ts
 * @description 워크스페이스 내 프로젝트 CRUD 및 참조 무결성 보장 순수 도메인 함수
 * - React, Zustand, UI에 전혀 의존하지 않는 호스트 비의존적(Host-Agnostic) 순수 함수
 * - 다중 프로젝트 컬렉션의 정합성, 자식 승격, 참조 블록 동기화를 전담
 */

import type { NodeId, OutlineNode } from '../../outline/model/types';
import { findNode } from '../../outline/queries/find';
import { updateNodeText } from '../../outline/transforms/node';
import { createDefaultProject } from '../model/defaults';
import type { Project, ProjectId, Workspace } from '../model/types';
import {
  cleanupProjectRefsInNodes,
  collectProjectRefTargets,
  createChildProjectRefNode,
  insertChildProjectRef,
  updateProjectRefTextInNodes,
} from '../reference/syncRef';

const UNTITLED_PROJECT = '제목 없는 프로젝트';

export interface AddChildProjectOptions {
  title?: string;
  parentProjectId?: ProjectId | null;
}

export interface AddChildProjectResult {
  updatedWorkspace: Workspace;
  newProject: Project;
  updatedParentRoots?: OutlineNode[];
}

/**
 * 워크스페이스에 새 프로젝트를 추가하고, 하위 프로젝트일 경우 부모 트리 맨 위 단계 끝에 참조 블록을 자동 삽입
 */
export function addChildProjectToWorkspace(
  workspace: Workspace,
  options: AddChildProjectOptions = {}
): AddChildProjectResult {
  const { title = '새 프로젝트', parentProjectId } = options;
  const newProj = createDefaultProject(title);
  let updatedParentRoots: OutlineNode[] | undefined;

  let updatedProjects: Record<ProjectId, Project> = {
    ...workspace.projects,
    [newProj.id]: newProj,
  };

  if (parentProjectId && workspace.projects[parentProjectId]) {
    newProj.parentProjectId = parentProjectId;
    const parent = workspace.projects[parentProjectId];

    updatedParentRoots = insertChildProjectRef(
      parent.rootNodes,
      createChildProjectRefNode(newProj.id, title)
    );

    const updatedParent: Project = {
      ...parent,
      rootNodes: updatedParentRoots,
      updatedAt: Date.now(),
    };

    updatedProjects = {
      ...updatedProjects,
      [parentProjectId]: updatedParent,
    };
  }

  const updatedWorkspace: Workspace = {
    ...workspace,
    projects: updatedProjects,
    updatedAt: Date.now(),
  };

  return {
    updatedWorkspace,
    newProject: newProj,
    updatedParentRoots,
  };
}

export interface RemoveProjectResult {
  updatedWorkspace: Workspace;
  promotedProjectIds: ProjectId[];
  success: boolean;
}

/**
 * 워크스페이스에서 프로젝트를 안전하게 삭제 (자식 승격 정책 + 타 프로젝트의 깨진 참조 해제)
 */
export function removeProjectFromWorkspace(
  workspace: Workspace,
  projectId: ProjectId
): RemoveProjectResult {
  const projectKeys = Object.keys(workspace.projects);
  if (projectKeys.length <= 1) {
    return {
      updatedWorkspace: workspace,
      promotedProjectIds: [],
      success: false,
    };
  }

  const targetProject = workspace.projects[projectId];
  const newProjects: Record<ProjectId, Project> = { ...workspace.projects };
  delete newProjects[projectId];

  const promotedProjectIds: ProjectId[] = [];

  for (const pId of Object.keys(newProjects)) {
    let proj = newProjects[pId];
    let changed = false;

    // 1. 승격 정책: 삭제 대상의 자식 프로젝트들은 부모의 parentProjectId로 안전 승격
    if (proj.parentProjectId === projectId) {
      proj = {
        ...proj,
        parentProjectId: targetProject?.parentProjectId ?? null,
        updatedAt: Date.now(),
      };
      promotedProjectIds.push(pId);
      changed = true;
    }

    // 2. 참조 청소 정책: 삭제된 프로젝트를 가리키던 모든 트리의 참조를 일반 불릿으로 안전 해제
    const cleanedRoots = cleanupProjectRefsInNodes(proj.rootNodes, projectId);
    if (cleanedRoots !== proj.rootNodes) {
      proj = {
        ...proj,
        rootNodes: cleanedRoots,
        updatedAt: Date.now(),
      };
      changed = true;
    }

    if (changed) {
      newProjects[pId] = proj;
    }
  }

  const nextActiveId =
    workspace.activeProjectId === projectId
      ? Object.keys(newProjects)[0]
      : workspace.activeProjectId;

  // 삭제된 프로젝트의 스냅샷은 더 이상 복원할 대상이 없으므로 함께 제거
  const newSnapshots = { ...workspace.snapshots };
  delete newSnapshots[projectId];

  let updatedWorkspace: Workspace = {
    ...workspace,
    projects: newProjects,
    activeProjectId: nextActiveId,
    snapshots: newSnapshots,
    updatedAt: Date.now(),
  };

  // 한 단계 위로 올라간 프로젝트는 새 부모의 아웃라인에도 연결 블록으로 보여야 한다.
  for (const promotedId of promotedProjectIds) {
    updatedWorkspace = linkChildProjectInParent(updatedWorkspace, promotedId);
  }

  return {
    updatedWorkspace,
    promotedProjectIds,
    success: true,
  };
}

/**
 * 하위 프로젝트가 부모의 아웃라인에 연결 블록으로 보이도록 맞춘다.
 * 부모가 없거나 이미 연결 블록이 있으면 아무것도 바꾸지 않는다.
 */
export function linkChildProjectInParent(
  workspace: Workspace,
  childProjectId: ProjectId
): Workspace {
  const child = workspace.projects[childProjectId];
  const parent = child?.parentProjectId ? workspace.projects[child.parentProjectId] : undefined;
  if (!child || !parent) return workspace;
  if (collectProjectRefTargets(parent.rootNodes).has(child.id)) return workspace;

  return {
    ...workspace,
    projects: {
      ...workspace.projects,
      [parent.id]: {
        ...parent,
        rootNodes: insertChildProjectRef(
          parent.rootNodes,
          createChildProjectRefNode(child.id, child.title)
        ),
        updatedAt: Date.now(),
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * 프로젝트의 불릿 트리를 `nextRoots` 로 바꾸면 연결 블록을 잃게 되는 하위 프로젝트들을 찾는다.
 * (지금은 연결 블록이 있는데 바뀐 뒤에는 없는, 이 프로젝트의 하위 프로젝트)
 */
export function findChildProjectsLosingRef(
  workspace: Workspace,
  projectId: ProjectId,
  nextRoots: OutlineNode[]
): ProjectId[] {
  const project = workspace.projects[projectId];
  if (!project) return [];

  const before = collectProjectRefTargets(project.rootNodes);
  if (before.size === 0) return [];

  const after = collectProjectRefTargets(nextRoots);
  return [...before].filter(
    (id) => !after.has(id) && workspace.projects[id]?.parentProjectId === projectId
  );
}

/**
 * 프로젝트 제목을 주어진 글자 그대로 바꾸고, 다른 프로젝트들 안의 연결 블록 글자도 함께 맞춘다.
 * (제목 입력 칸에서 타이핑하는 도중의 공백도 그대로 보존한다)
 */
export function setProjectTitleInWorkspace(
  workspace: Workspace,
  projectId: ProjectId,
  title: string
): Workspace {
  const project = workspace.projects[projectId];
  if (!project) return workspace;

  const updatedProjects: Record<ProjectId, Project> = {
    ...workspace.projects,
    [projectId]: { ...project, title, updatedAt: Date.now() },
  };

  for (const pId of Object.keys(updatedProjects)) {
    if (pId === projectId) continue;
    const p = updatedProjects[pId];
    const newRoots = updateProjectRefTextInNodes(p.rootNodes, projectId, title);
    if (newRoots !== p.rootNodes) {
      updatedProjects[pId] = {
        ...p,
        rootNodes: newRoots,
        updatedAt: Date.now(),
      };
    }
  }

  return {
    ...workspace,
    projects: updatedProjects,
    updatedAt: Date.now(),
  };
}

/**
 * 워크스페이스 내 프로젝트 제목 변경 및 타 프로젝트들 내 참조 블록 텍스트 일괄 동기화
 */
export function renameProjectInWorkspace(
  workspace: Workspace,
  projectId: ProjectId,
  newTitle: string
): Workspace {
  return setProjectTitleInWorkspace(workspace, projectId, newTitle.trim() || UNTITLED_PROJECT);
}

/**
 * 연결 블록의 글자 편집을 마쳤을 때, 그 글자를 가리키는 프로젝트의 제목으로 확정한다.
 * - 비워 둔 채 마쳤으면 제목은 그대로 두고, 블록 글자를 원래 제목으로 되돌린다.
 * - 타이핑 도중에는 호출하지 않는다. (지우는 중간 글자가 제목이 되면 안 된다)
 */
export function commitProjectRefText(
  workspace: Workspace,
  projectId: ProjectId,
  nodeId: NodeId
): Workspace {
  const project = workspace.projects[projectId];
  const node = project ? findNode(project.rootNodes, nodeId) : null;
  const target =
    node?.ref?.type === 'project' ? workspace.projects[node.ref.targetProjectId] : undefined;
  if (!project || !node || !target) return workspace;

  const text = node.text.trim();
  if (text === '') {
    const restored = updateNodeText(
      project.rootNodes,
      nodeId,
      target.title.trim() || UNTITLED_PROJECT
    );
    return syncProjectRootsInWorkspace(workspace, projectId, restored.newNodes);
  }
  if (text === target.title) return workspace;

  return renameProjectInWorkspace(workspace, target.id, text);
}

/**
 * 특정 프로젝트의 rootNodes 를 교체한다. (필요하면 제목도 함께)
 * 연결 블록의 글자는 여기서 프로젝트 제목으로 옮기지 않는다 — `commitProjectRefText` 가 맡는다.
 */
export function syncProjectRootsInWorkspace(
  workspace: Workspace,
  projectId: ProjectId,
  roots: OutlineNode[],
  title?: string
): Workspace {
  const project = workspace.projects[projectId];
  if (!project) return workspace;

  return {
    ...workspace,
    projects: {
      ...workspace.projects,
      [projectId]: {
        ...project,
        title: title ?? project.title,
        rootNodes: roots,
        updatedAt: Date.now(),
      },
    },
    updatedAt: Date.now(),
  };
}

export interface ImportProjectsResult {
  updatedWorkspace: Workspace;
  importedProjectIds: ProjectId[];
}

/**
 * 다른 워크스페이스의 프로젝트와 스냅샷을 현재 워크스페이스에 더한다.
 * 이미 같은 id 의 프로젝트가 있으면 건너뛴다. (같은 파일을 두 번 가져와도 결과가 같다)
 */
export function importProjectsIntoWorkspace(
  workspace: Workspace,
  source: Workspace
): ImportProjectsResult {
  const importedProjectIds = Object.keys(source.projects).filter(
    (id) => !workspace.projects[id]
  );
  if (importedProjectIds.length === 0) {
    return { updatedWorkspace: workspace, importedProjectIds };
  }

  const projects: Record<ProjectId, Project> = { ...workspace.projects };
  const snapshots = { ...workspace.snapshots };
  for (const id of importedProjectIds) {
    projects[id] = source.projects[id];
    const sourceSnapshots = source.snapshots[id];
    if (sourceSnapshots && sourceSnapshots.length > 0) {
      snapshots[id] = sourceSnapshots;
    }
  }

  // 함께 오지 않은 부모를 가리키는 프로젝트는 최상위로 둔다.
  for (const id of importedProjectIds) {
    const parentId = projects[id].parentProjectId;
    if (parentId && !projects[parentId]) {
      projects[id] = { ...projects[id], parentProjectId: null };
    }
  }

  return {
    updatedWorkspace: { ...workspace, projects, snapshots, updatedAt: Date.now() },
    importedProjectIds,
  };
}
