/**
 * @file deserializeVault.ts
 * @description 보관함 파일들 -> Workspace 역직렬화 (순수 함수, 어긋난 부분 자동 바로잡기 포함)
 *
 * 진실은 메타 파일이 아니라 실제로 있는 프로젝트 파일들이다.
 * - 메타 파일에 없어도 최상위에 프로젝트 파일이 있으면 받아들인다.
 *   (구버전 단일 문서 파일도 규격이 같아서 그대로 프로젝트가 된다)
 * - 메타 파일이 없거나 깨졌으면 새로 만든다.
 * - 같은 id 의 파일이 둘이면 더 최근에 수정된 쪽을 쓰고, 다른 쪽은 건드리지 않는다.
 * - 사라진 부모를 가리키는 하위 프로젝트는 최상위로 올린다.
 */

import { z } from 'zod';
import { generateNodeId } from '../../outline/model/id';
import { OUTLINE_FORMAT_VERSION } from '../../outline/model/version';
import { projectSchema, snapshotSchema } from '../../workspace/model/schema';
import type { Project, ProjectId, Snapshot, Workspace } from '../../workspace/model/types';
import { toVaultSnapshotPath } from './fileName';
import {
  VAULT_FILE_EXTENSION,
  VAULT_MANIFEST_PATH,
  VAULT_SNAPSHOTS_DIR,
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

const snapshotsFileSchema = z
  .object({
    projectId: z.string().min(1),
    snapshots: z.array(snapshotSchema),
  })
  .passthrough();

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    const json = parseJson(files[path]);
    if (!json.ok) {
      skipped.push({ path, reason: 'parse-error' });
      continue;
    }
    if (!isRecord(json.value)) {
      skipped.push({ path, reason: 'not-a-project' });
      continue;
    }

    const { version, ...fields } = json.value;
    if (typeof version === 'string' && version !== OUTLINE_FORMAT_VERSION) {
      skipped.push({ path, reason: 'unsupported-version' });
      continue;
    }

    const parsed = projectSchema.safeParse(fields);
    if (!parsed.success) {
      skipped.push({ path, reason: 'not-a-project' });
      continue;
    }

    const project = parsed.data;
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

  // 3. 스냅샷 파일들 (주인 프로젝트가 있고, 제자리에 있는 파일만 받아들인다)
  const diskSnapshots: Record<ProjectId, Snapshot[]> = {};
  for (const path of Object.keys(files)) {
    if (!path.startsWith(`${VAULT_SNAPSHOTS_DIR}/`) || !hasJsonExtension(path)) continue;
    const json = parseJson(files[path]);
    if (!json.ok) continue;
    const parsed = snapshotsFileSchema.safeParse(json.value);
    if (!parsed.success) continue;

    const { projectId, snapshots } = parsed.data;
    if (!diskProjects[projectId]) continue;
    if (toVaultSnapshotPath(VAULT_SNAPSHOTS_DIR, projectId) !== path) continue;
    diskSnapshots[projectId] = snapshots;
  }

  const disk = {
    projects: diskProjects,
    snapshots: diskSnapshots,
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

  // 4. 어긋난 부분 바로잡기. 고친 프로젝트는 새 객체가 되므로, 다음 저장 때 파일에도 반영된다.
  const projects: Record<ProjectId, Project> = {};
  for (const project of ordered) {
    const hasMissingParent =
      typeof project.parentProjectId === 'string' && !diskProjects[project.parentProjectId];
    projects[project.id] = hasMissingParent ? { ...project, parentProjectId: null } : project;
  }

  const activeProjectId =
    manifest && projects[manifest.activeProjectId] ? manifest.activeProjectId : ordered[0].id;

  const workspace: Workspace = {
    version: OUTLINE_FORMAT_VERSION,
    id: manifest?.id ?? generateNodeId(),
    title: manifest?.title ?? options.fallbackTitle,
    projects,
    activeProjectId,
    snapshots: { ...diskSnapshots },
    createdAt: manifest?.createdAt ?? Math.min(...ordered.map((p) => p.createdAt)),
    updatedAt: Math.max(...ordered.map((p) => p.updatedAt)),
  };

  return { success: true, workspace, disk, skipped };
}
