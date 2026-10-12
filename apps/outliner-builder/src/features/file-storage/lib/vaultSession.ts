/**
 * @file vaultSession.ts
 * @description 보관함 읽기 / 맞추기(sync) — 저장 파이프라인의 유일한 디스크 출입구
 *
 * 보관함마다 "디스크에 지금 무엇이 있는지"의 기준선을 기억해 두고,
 * 맞출 때는 그 기준선과 워크스페이스의 차이만 폴더에 반영한다.
 */

import {
  type VaultDiskState,
  type Workspace,
  deserializeVault,
  isVaultInSync,
  planVaultSync,
} from '@vibe/outliner-core';
import type { FileIOFailure } from './outlineFile';
import { applyVaultPlan, readVaultFiles } from './vaultFs';

// 기준선은 폴더 핸들에 딸린 정보다. 핸들이 사라지면 함께 사라진다.
const diskStates = new WeakMap<FileSystemDirectoryHandle, VaultDiskState>();

export type ReadVaultResult =
  | { success: true; workspace: Workspace | null }
  | { success: false; failure: FileIOFailure };

/** 보관함을 읽어 워크스페이스로 만든다. 프로젝트가 하나도 없는 빈 보관함이면 workspace 는 null */
export async function readVault(handle: FileSystemDirectoryHandle): Promise<ReadVaultResult> {
  const result = deserializeVault(await readVaultFiles(handle), { fallbackTitle: handle.name });
  if (!result.success) {
    return { success: false, failure: { kind: 'unsupported-version', version: result.version } };
  }

  if (result.skipped.length > 0) {
    console.warn('보관함에서 프로젝트로 읽지 않은 파일:', result.skipped);
  }
  diskStates.set(handle, result.disk);
  return { success: true, workspace: result.workspace };
}

async function getDiskState(handle: FileSystemDirectoryHandle): Promise<VaultDiskState> {
  const known = diskStates.get(handle);
  if (known) return known;

  // 기준선을 모르면 무엇을 지워야 하는지도 알 수 없다. 폴더를 다시 읽어 기준선을 세운다.
  const result = deserializeVault(await readVaultFiles(handle), { fallbackTitle: handle.name });
  if (!result.success) throw new Error(`지원하지 않는 보관함 버전: ${result.version}`);
  diskStates.set(handle, result.disk);
  return result.disk;
}

/** 방금 읽은 보관함에 대해, 이 워크스페이스가 디스크와 달라서 써야 할 것이 있는지 */
export function needsVaultSync(handle: FileSystemDirectoryHandle, workspace: Workspace): boolean {
  const disk = diskStates.get(handle);
  return !disk || !isVaultInSync(disk, workspace);
}

/** 워크스페이스를 보관함에 맞춘다. 달라진 파일만 쓰고, 사라진 프로젝트의 파일은 지운다. */
export async function syncVault(
  handle: FileSystemDirectoryHandle,
  workspace: Workspace
): Promise<void> {
  const plan = planVaultSync(await getDiskState(handle), workspace);
  await applyVaultPlan(handle, plan);
  diskStates.set(handle, plan.disk);
}
