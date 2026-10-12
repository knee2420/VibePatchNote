/**
 * @file workspaceOperations.ts
 * @description 워크스페이스 안의 프로젝트 추가·삭제·제목 변경·트리 교체 (순수 함수)
 * - React, Zustand, UI에 전혀 의존하지 않는 호스트 비의존적(Host-Agnostic) 순수 함수
 * - 프로젝트들은 서로 나란히 놓인 단건이라, 한 프로젝트를 바꿔도 다른 프로젝트는 건드리지 않는다.
 */

import type { OutlineNode } from '../../outline/model/types';
import { createDefaultProject } from '../model/defaults';
import type { Project, ProjectId, Workspace } from '../model/types';

const UNTITLED_PROJECT = '제목 없는 스캐폴드';

export interface AddProjectResult {
  updatedWorkspace: Workspace;
  newProject: Project;
}

/**
 * 워크스페이스에 새 프로젝트를 추가한다.
 */
export function addProjectToWorkspace(
  workspace: Workspace,
  title: string = '새 스캐폴드'
): AddProjectResult {
  const newProject = createDefaultProject(title);

  return {
    updatedWorkspace: {
      ...workspace,
      projects: { ...workspace.projects, [newProject.id]: newProject },
      updatedAt: Date.now(),
    },
    newProject,
  };
}

export interface RemoveProjectResult {
  updatedWorkspace: Workspace;
  success: boolean;
}

/**
 * 워크스페이스에서 프로젝트를 삭제한다. 마지막 남은 프로젝트는 지우지 않는다.
 */
export function removeProjectFromWorkspace(
  workspace: Workspace,
  projectId: ProjectId
): RemoveProjectResult {
  if (!workspace.projects[projectId] || Object.keys(workspace.projects).length <= 1) {
    return { updatedWorkspace: workspace, success: false };
  }

  const projects: Record<ProjectId, Project> = { ...workspace.projects };
  delete projects[projectId];

  return {
    updatedWorkspace: {
      ...workspace,
      projects,
      activeProjectId:
        workspace.activeProjectId === projectId
          ? Object.keys(projects)[0]
          : workspace.activeProjectId,
      updatedAt: Date.now(),
    },
    success: true,
  };
}

/**
 * 프로젝트 제목을 주어진 글자 그대로 바꾼다.
 * (제목 입력 칸에서 타이핑하는 도중의 공백도 그대로 보존한다)
 */
export function setProjectTitleInWorkspace(
  workspace: Workspace,
  projectId: ProjectId,
  title: string
): Workspace {
  const project = workspace.projects[projectId];
  if (!project) return workspace;

  return {
    ...workspace,
    projects: {
      ...workspace.projects,
      [projectId]: { ...project, title, updatedAt: Date.now() },
    },
    updatedAt: Date.now(),
  };
}

/**
 * 프로젝트 제목을 다듬어 바꾼다. 비어 있으면 기본 제목을 쓴다.
 */
export function renameProjectInWorkspace(
  workspace: Workspace,
  projectId: ProjectId,
  newTitle: string
): Workspace {
  return setProjectTitleInWorkspace(workspace, projectId, newTitle.trim() || UNTITLED_PROJECT);
}

/**
 * 특정 프로젝트의 rootNodes 를 교체한다. (필요하면 제목도 함께)
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
