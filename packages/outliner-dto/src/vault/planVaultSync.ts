/**
 * @file planVaultSync.ts
 * @description Workspace -> 보관함 파일 쓰기/지우기 계획 (순수 함수)
 *
 * 규칙은 하나다: "디스크에 있다고 알고 있는 것"과 "지금의 워크스페이스"를 비교해 달라진 파일만 고친다.
 * 어떤 기능이 워크스페이스를 바꿨는지는 알 필요가 없다. 프로젝트가 생기면 파일이 생기고,
 * 사라지면 파일이 지워지고, 제목이 바뀌면 파일 이름이 바뀐다.
 */

import { type Workspace, OUTLINE_FORMAT_VERSION } from '@vibe/outliner-core';
import { serializeProjectFile } from '../project/projectFile';
import { allocateProjectFileNames } from './fileName';
import {
  VAULT_MANIFEST_PATH,
  type VaultDiskState,
  type VaultSyncPlan,
  type VaultWrite,
} from './vaultDto';

/**
 * 워크스페이스 메타 파일. 프로젝트 내용과 수정 시각은 담지 않는다.
 * (담으면 불릿 한 글자를 고칠 때마다 이 파일도 다시 쓰게 된다)
 */
export function serializeVaultManifest(workspace: Workspace): string {
  return JSON.stringify(
    {
      version: OUTLINE_FORMAT_VERSION,
      id: workspace.id,
      title: workspace.title,
      activeProjectId: workspace.activeProjectId,
      createdAt: workspace.createdAt,
    },
    null,
    2
  );
}

/**
 * 워크스페이스를 디스크에 맞추기 위한 계획을 세운다.
 * 쓰기 순서는 프로젝트 파일 -> 메타 파일이고, 지우기는 모든 쓰기 뒤에 한다.
 * 도중에 끊겨도 새 내용이 먼저 디스크에 있으므로, 다시 열었을 때 잃는 것이 없다.
 */
export function planVaultSync(disk: VaultDiskState, workspace: Workspace): VaultSyncPlan {
  const writes: VaultWrite[] = [];
  const deletes: string[] = [];

  // 1. 프로젝트 파일
  const projectFiles = allocateProjectFileNames(
    workspace.projects,
    disk.projectFiles,
    disk.foreignFiles
  );

  for (const [id, project] of Object.entries(workspace.projects)) {
    const path = projectFiles[id];
    const previousPath = disk.projectFiles[id];
    if (disk.projects[id] !== project || previousPath !== path) {
      writes.push({ path, text: serializeProjectFile(project) });
    }
    if (previousPath && previousPath !== path) {
      deletes.push(previousPath);
    }
  }

  for (const [id, previousPath] of Object.entries(disk.projectFiles)) {
    if (!workspace.projects[id]) deletes.push(previousPath);
  }

  // 2. 워크스페이스 메타 파일 (맨 마지막)
  const manifestText = serializeVaultManifest(workspace);
  if (manifestText !== disk.manifestText) {
    writes.push({ path: VAULT_MANIFEST_PATH, text: manifestText });
  }

  // 방금 쓴 파일을 지우는 일은 절대 없어야 한다. (대소문자를 구분하지 않는 파일 시스템 대비)
  const writtenKeys = new Set(writes.map((w) => w.path.toLowerCase()));
  const safeDeletes = deletes.filter((path) => !writtenKeys.has(path.toLowerCase()));

  return {
    writes,
    deletes: safeDeletes,
    disk: {
      projects: workspace.projects,
      projectFiles,
      foreignFiles: disk.foreignFiles,
      manifestText,
    },
  };
}

/** 워크스페이스가 이미 디스크와 같아서 쓸 것이 없는지 */
export function isVaultInSync(disk: VaultDiskState, workspace: Workspace): boolean {
  const plan = planVaultSync(disk, workspace);
  return plan.writes.length === 0 && plan.deletes.length === 0;
}
