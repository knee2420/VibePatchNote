/**
 * @file deserializeVault.ts
 * @description 보관함 파일들 -> Workspace 역직렬화 (순수 함수, 어긋난 부분 자동 바로잡기 포함)
 *
 * 진실은 메타 파일이 아니라 실제로 있는 프로젝트 파일들이다.
 * - 메타 파일에 없어도 최상위에 프로젝트 파일이 있으면 받아들인다.
 *   (구버전 단일 문서 파일도 규격이 같아서 그대로 프로젝트가 된다)
 * - 메타 파일이 없거나 깨졌으면 새로 만든다.
 * - 같은 id 의 파일이 둘이면 더 최근에 수정된 쪽을 쓰고, 다른 쪽은 건드리지 않는다.
 */

import { z } from 'zod';
import {
  type Project,
  type ProjectId,
  type Workspace,
  OUTLINE_FORMAT_VERSION,
  generateNodeId,
} from '@vibe/outliner-core';
import { parseProjectFile } from '../project/projectFile';
import {
  VAULT_FILE_EXTENSION,
  VAULT_MANIFEST_PATH,
  type DeserializeVaultResult,
  type VaultFiles,
  type VaultSkippedFile,
} from './vaultDto';

const manifestSchema = z
  .object({
    version: z.string(),
    id: z.string().min(1),
    title: z.string(),
    activeProjectId: z.string(),
    createdAt: z.number(),
  })
  .passthrough();

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function hasJsonExtension(path: string): boolean {
  return path.toLowerCase().endsWith(VAULT_FILE_EXTENSION);
}

export interface DeserializeVaultOptions {
  /** 메타 파일이 없을 때 워크스페이스 제목으로 쓸 이름 (보통 폴더 이름) */
  fallbackTitle: string;
}

export function deserializeVault(
  files: VaultFiles,
  options: DeserializeVaultOptions
): DeserializeVaultResult {
  // 1. 워크스페이스 메타 파일
  const manifestText = files[VAULT_MANIFEST_PATH] ?? null;
  const manifestJson = manifestText === null ? null : parseJson(manifestText);
  const manifestParsed =
    manifestJson?.ok === true ? manifestSchema.safeParse(manifestJson.value) : null;
  const manifest = manifestParsed?.success ? manifestParsed.data : null;

  if (manifest && manifest.version !== OUTLINE_FORMAT_VERSION) {
    return { success: false, reason: 'unsupported-version', version: manifest.version };
  }

  // 2. 최상위의 프로젝트 파일들
  const skipped: VaultSkippedFile[] = [];
  const diskProjects: Record<ProjectId, Project> = {};
  const projectFiles: Record<ProjectId, string> = {};

  const rootPaths = Object.keys(files)
    .filter((path) => !path.includes('/') && hasJsonExtension(path))
    .sort();

  for (const path of rootPaths) {
    const parsed = parseProjectFile(files[path]);
    if (!parsed.success) {
      skipped.push({ path, reason: parsed.reason });
      continue;
    }

    const project = parsed.project;
    const rival = diskProjects[project.id];
    if (rival && rival.updatedAt >= project.updatedAt) {
      skipped.push({ path, reason: 'duplicate-id' });
      continue;
    }
    if (rival) {
      skipped.push({ path: projectFiles[project.id], reason: 'duplicate-id' });
    }
    diskProjects[project.id] = project;
    projectFiles[project.id] = path;
  }

  const disk = {
    projects: diskProjects,
    projectFiles,
    foreignFiles: skipped.map((s) => s.path),
    manifestText,
  };

  const ordered = Object.values(diskProjects).sort(
    (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)
  );
  if (ordered.length === 0) {
    return { success: true, workspace: null, disk, skipped };
  }

  const activeProjectId =
    manifest && diskProjects[manifest.activeProjectId]
      ? manifest.activeProjectId
      : ordered[0].id;

  const workspace: Workspace = {
    version: OUTLINE_FORMAT_VERSION,
    id: manifest?.id ?? generateNodeId(),
    title: manifest?.title ?? options.fallbackTitle,
    projects: diskProjects,
    activeProjectId,
    createdAt: manifest?.createdAt ?? Math.min(...ordered.map((p) => p.createdAt)),
    updatedAt: Math.max(...ordered.map((p) => p.updatedAt)),
  };

  return { success: true, workspace, disk, skipped };
}
