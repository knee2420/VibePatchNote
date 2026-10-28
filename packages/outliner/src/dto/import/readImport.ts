/**
 * @file readImport.ts
 * @description 가져올 파일 묶음 -> 새 Workspace (순수 함수, 구조 호환성 확인만 한다)
 *
 * 확인하는 것은 묶음 안에서의 구조뿐이다.
 * - 프로젝트 파일 규격이거나, 예전 방식의 워크스페이스 통파일이면 받아들인다.
 * - 같은 id 의 프로젝트가 둘이면 더 최근에 수정된 쪽만 받는다.
 * 보관함 메타(.outliner)는 가져오지 않는다.
 */

import {
  type Project,
  type ProjectId,
  type Workspace,
  OUTLINE_FORMAT_VERSION,
  generateNodeId,
} from '../../core';
import { countNodes } from '../project/countNodes';
import { PROJECT_FILE_EXTENSION, parseProjectValue } from '../project/projectFile';
import { safeValidateWorkspace } from '../schema/workspaceSchema';
import type {
  ImportFiles,
  ImportResult,
  ImportSkippedFile,
  ReadImportOptions,
} from './importTypes';

/** 점으로 시작하는 폴더(.outliner 등) 밖에 있는 .json 파일만 가져오기 대상이다. */
function isImportablePath(path: string): boolean {
  if (!path.toLowerCase().endsWith(PROJECT_FILE_EXTENSION)) return false;
  return !path.split('/').some((segment) => segment.startsWith('.'));
}

export function readImport(files: ImportFiles, options: ReadImportOptions): ImportResult {
  const skipped: ImportSkippedFile[] = [];
  const accepted: Record<ProjectId, { path: string; project: Project }> = {};

  const accept = (path: string, project: Project) => {
    const rival = accepted[project.id];
    if (rival && rival.project.updatedAt >= project.updatedAt) {
      skipped.push({ path, reason: 'duplicate-id' });
      return;
    }
    if (rival) skipped.push({ path: rival.path, reason: 'duplicate-id' });
    accepted[project.id] = { path, project };
  };

  for (const path of Object.keys(files).filter(isImportablePath).sort()) {
    let value: unknown;
    try {
      value = JSON.parse(files[path]);
    } catch {
      skipped.push({ path, reason: 'parse-error' });
      continue;
    }

    const asProject = parseProjectValue(value);
    if (asProject.success) {
      accept(path, asProject.project);
      continue;
    }
    if (asProject.reason === 'unsupported-version') {
      skipped.push({ path, reason: 'unsupported-version', version: asProject.version });
      continue;
    }

    // 예전 방식: 워크스페이스 전체를 한 파일에 담은 통파일
    const asWorkspace = safeValidateWorkspace(value);
    if (!asWorkspace.success) {
      skipped.push({ path, reason: 'not-a-project' });
      continue;
    }
    for (const project of Object.values(asWorkspace.data.projects)) accept(path, project);
  }

  const ordered = Object.values(accepted).sort(
    (a, b) =>
      a.project.createdAt - b.project.createdAt || a.project.id.localeCompare(b.project.id)
  );
  if (ordered.length === 0) {
    return { workspace: null, projects: [], skipped };
  }

  const projects: Record<ProjectId, Project> = {};
  for (const { project } of ordered) projects[project.id] = project;

  const now = Date.now();
  const workspace: Workspace = {
    version: OUTLINE_FORMAT_VERSION,
    id: generateNodeId(),
    title: options.title,
    projects,
    activeProjectId: ordered[0].project.id,
    createdAt: now,
    updatedAt: now,
  };

  return {
    workspace,
    projects: ordered.map(({ path, project }) => ({
      path,
      projectId: project.id,
      title: project.title,
      nodeCount: countNodes(project.rootNodes),
    })),
    skipped,
  };
}
