/**
 * @file vaultFs.ts
 * @description 보관함 폴더 핸들 <-> "경로 -> 텍스트" 묶음 (브라우저 File System Access API 어댑터)
 *
 * 폴더 안의 무엇이 프로젝트이고 무엇이 메타인지는 여기서 판단하지 않는다.
 * 그 규칙은 `@vibe/outliner-core` 의 DTO 엔진이 갖고 있고, 여기는 읽고 쓰는 손발일 뿐이다.
 */

import {
  type VaultFiles,
  type VaultSyncPlan,
  VAULT_FILE_EXTENSION,
  VAULT_MANIFEST_PATH,
  VAULT_SNAPSHOTS_DIR,
} from '@vibe/outliner-core';

type PermissionQuery = (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;

/** 아직 TypeScript DOM 타입에 없는 File System Access API 멤버 */
type VaultDirectoryHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  queryPermission?: PermissionQuery;
  requestPermission?: PermissionQuery;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandle>;
};

export function isVaultSupported(): boolean {
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function';
}

/** 사용자에게 보관함으로 쓸 폴더를 고르게 한다. (취소하면 AbortError 를 던진다) */
export function pickVaultDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) throw new Error('showDirectoryPicker 를 지원하지 않는 브라우저');
  return picker.call(window, { id: 'outliner-vault', mode: 'readwrite' });
}

/** 지금 이 폴더를 읽고 쓸 수 있는지 (사용자에게 묻지 않는다) */
export async function hasVaultPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const query = (handle as VaultDirectoryHandle).queryPermission;
  if (!query) return true;
  return (await query.call(handle, { mode: 'readwrite' })) === 'granted';
}

/** 이 폴더를 읽고 쓸 권한을 사용자에게 요청한다. (사용자 클릭 안에서만 호출할 수 있다) */
export async function requestVaultPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const request = (handle as VaultDirectoryHandle).requestPermission;
  if (!request) return true;
  return (await request.call(handle, { mode: 'readwrite' })) === 'granted';
}

function isJsonFile(name: string, handle: FileSystemHandle): handle is FileSystemFileHandle {
  return handle.kind === 'file' && name.toLowerCase().endsWith(VAULT_FILE_EXTENSION);
}

async function readText(handle: FileSystemFileHandle): Promise<string> {
  return (await handle.getFile()).text();
}

async function getDirectoryIfExists(
  parent: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemDirectoryHandle | null> {
  let current = parent;
  for (const segment of path.split('/')) {
    try {
      current = await current.getDirectoryHandle(segment);
    } catch {
      return null;
    }
  }
  return current;
}

/** 보관함에서 DTO 엔진이 볼 파일들을 읽는다: 최상위 .json, 메타 파일, 스냅샷 파일 */
export async function readVaultFiles(root: FileSystemDirectoryHandle): Promise<VaultFiles> {
  const files: VaultFiles = {};

  for await (const [name, handle] of (root as VaultDirectoryHandle).entries()) {
    if (isJsonFile(name, handle)) files[name] = await readText(handle);
  }

  const manifestSegments = VAULT_MANIFEST_PATH.split('/');
  const manifestName = manifestSegments.pop()!;
  const metaDir = await getDirectoryIfExists(root, manifestSegments.join('/'));
  if (metaDir) {
    try {
      files[VAULT_MANIFEST_PATH] = await readText(await metaDir.getFileHandle(manifestName));
    } catch {
      // 메타 파일이 없으면 DTO 엔진이 새로 만든다.
    }
  }

  const snapshotsDir = await getDirectoryIfExists(root, VAULT_SNAPSHOTS_DIR);
  if (snapshotsDir) {
    for await (const [name, handle] of (snapshotsDir as VaultDirectoryHandle).entries()) {
      if (isJsonFile(name, handle)) {
        files[`${VAULT_SNAPSHOTS_DIR}/${name}`] = await readText(handle);
      }
    }
  }

  return files;
}

async function resolveParent(
  root: FileSystemDirectoryHandle,
  path: string,
  create: boolean
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
  const segments = path.split('/');
  const name = segments.pop()!;
  let dir = root;
  for (const segment of segments) {
    dir = await dir.getDirectoryHandle(segment, { create });
  }
  return { dir, name };
}

function isNotFound(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'NotFoundError';
}

/** 계획대로 쓴다: 쓰기를 순서대로 모두 끝낸 뒤 지우기를 한다. */
export async function applyVaultPlan(
  root: FileSystemDirectoryHandle,
  plan: VaultSyncPlan
): Promise<void> {
  for (const { path, text } of plan.writes) {
    const { dir, name } = await resolveParent(root, path, true);
    const file = await dir.getFileHandle(name, { create: true });
    const writable = await file.createWritable();
    await writable.write(text);
    await writable.close();
  }

  for (const path of plan.deletes) {
    try {
      const { dir, name } = await resolveParent(root, path, false);
      await dir.removeEntry(name);
    } catch (err) {
      // 이미 없는 파일이면 지울 것이 없을 뿐이다.
      if (!isNotFound(err)) throw err;
    }
  }
}
