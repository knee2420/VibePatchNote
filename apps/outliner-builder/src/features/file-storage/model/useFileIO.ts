/**
 * @file useFileIO.ts
 * @description 보관함 열기 / 다시 열기 / 가져온 워크스페이스 열기 처리 훅
 *
 * 저장 버튼은 없다. 폴더 하나를 보관함으로 고르면 이후 변경은 `useAutoSave` 가 알아서 기록한다.
 * 이 훅은 "지금 어느 워크스페이스를 열고, 어느 폴더에 묶을지"만 다룬다.
 */

import { useCallback, useEffect, useState } from 'react';
import { type Workspace, createEmptyWorkspace } from '@vibe/outliner/core';
import { useWorkspaceStore } from '@/entities/workspace';
import type { FileIOFailure } from '../lib/fileIOFailure';
import {
  hasVaultPermission,
  isVaultSupported,
  pickVaultDirectory,
  requestVaultPermission,
} from '../lib/vaultFs';
import { recallVault, rememberVault } from '../lib/vaultRegistry';
import { needsVaultSync, readVault, syncVault } from '../lib/vaultSession';

/** 가져온 워크스페이스를 열려던 시도의 결과 */
export type OpenImportedResult = 'opened' | 'cancelled' | 'folder-not-empty' | 'failed';

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** 다른 워크스페이스로 바꾸기 전에, 지금 워크스페이스의 아직 기록되지 않은 변경을 마저 기록한다. */
async function flushPendingSave(): Promise<void> {
  const { workspace, vaultHandle, isDirty, markClean } = useWorkspaceStore.getState();
  if (!vaultHandle || !isDirty) return;
  await syncVault(vaultHandle, workspace);
  markClean(workspace);
}

export function useFileIO() {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const bindVault = useWorkspaceStore((s) => s.bindVault);

  const [failure, setFailure] = useState<FileIOFailure | null>(null);
  // 지난번에 쓰던 보관함을 확인하는 동안은 첫 화면을 아직 정하지 않는다.
  const [isRestoring, setIsRestoring] = useState(true);
  // 기억은 하고 있지만 브라우저가 접근 허용을 다시 물어야 하는 보관함
  const [recentVault, setRecentVault] = useState<FileSystemDirectoryHandle | null>(null);
  // 보관함 없이 쓰는 임시 모드 (폴더 접근을 지원하지 않는 브라우저용)
  const [isTemporary, setIsTemporary] = useState(false);

  const dismissFailure = useCallback(() => setFailure(null), []);
  const startTemporary = useCallback(() => setIsTemporary(true), []);

  // 폴더를 읽어 워크스페이스로 올리고 그 폴더에 묶는다.
  const enterVault = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      try {
        const result = await readVault(handle);
        if (!result.success) {
          setFailure(result.failure);
          return false;
        }

        const { vaultHandle, isDirty } = useWorkspaceStore.getState();
        const hasUnsavedWork = !vaultHandle && isDirty;
        if (result.workspace) {
          // 폴더 없이 작업하던 내용은 이 보관함을 여는 순간 사라진다. 지금 내용을 저장하려면 빈 폴더를 골라야 한다.
          if (
            hasUnsavedWork &&
            !window.confirm(
              `'${handle.name}' 폴더에는 이미 스캐폴드가 있습니다.\n` +
                '이 폴더를 열면 지금 저장하지 않은 내용은 사라집니다. (지금 내용을 저장하려면 빈 폴더를 고르세요)\n' +
                '계속하시겠습니까?'
            )
          ) {
            return false;
          }
          loadWorkspace(result.workspace, handle, {
            dirty: needsVaultSync(handle, result.workspace),
          });
        } else if (hasUnsavedWork) {
          // 빈 폴더를 골랐고 보관함 없이 작업하던 내용이 있으면, 그 내용을 이 보관함에 담는다.
          bindVault(handle);
        } else {
          loadWorkspace(createEmptyWorkspace(handle.name), handle, { dirty: true });
        }

        void rememberVault(handle);
        setRecentVault(null);
        setFailure(null);
        return true;
      } catch (err: unknown) {
        console.error('보관함 열기 오류:', err);
        setFailure({ kind: 'open-failed' });
        return false;
      }
    },
    [bindVault, loadWorkspace]
  );

  // 0. 시작할 때 지난번 보관함을 다시 연다. 접근 허용이 풀렸으면 사용자가 눌러서 다시 열게 둔다.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const handle = await recallVault();
      if (cancelled) return;
      if (handle && (await hasVaultPermission(handle))) {
        if (!cancelled) await enterVault(handle);
      } else if (handle) {
        setRecentVault(handle);
      }
      if (!cancelled) setIsRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [enterVault]);

  // 1. 보관함으로 쓸 폴더 고르기
  const openVault = useCallback(async () => {
    if (!isVaultSupported()) {
      setFailure({ kind: 'vault-unsupported' });
      return false;
    }
    try {
      return await enterVault(await pickVaultDirectory());
    } catch (err: unknown) {
      if (!isAbort(err)) {
        console.error('보관함 선택 오류:', err);
        setFailure({ kind: 'open-failed' });
      }
      return false;
    }
  }, [enterVault]);

  // 2. 기억해 둔 보관함 다시 열기 (접근 허용을 다시 받는다)
  const reopenRecentVault = useCallback(async () => {
    if (!recentVault) return false;
    try {
      if (!(await requestVaultPermission(recentVault))) {
        setFailure({ kind: 'permission-denied' });
        return false;
      }
      return await enterVault(recentVault);
    } catch (err: unknown) {
      console.error('보관함 다시 열기 오류:', err);
      setFailure({ kind: 'open-failed' });
      return false;
    }
  }, [enterVault, recentVault]);

  // 3. 가져온 워크스페이스를, 사용자가 고른 빈 폴더에 묶어 새로 연다.
  //    프로젝트가 이미 있는 폴더에는 열지 않는다. (남의 데이터를 기존 보관함과 섞지 않는다)
  const openImportedInVault = useCallback(
    async (workspace: Workspace): Promise<OpenImportedResult> => {
      try {
        const handle = await pickVaultDirectory();
        const existing = await readVault(handle);
        if (!existing.success || existing.workspace) return 'folder-not-empty';

        await flushPendingSave();
        loadWorkspace(workspace, handle, { dirty: true });
        void rememberVault(handle);
        setRecentVault(null);
        setFailure(null);
        return 'opened';
      } catch (err: unknown) {
        if (isAbort(err)) return 'cancelled';
        console.error('가져온 워크스페이스 열기 오류:', err);
        return 'failed';
      }
    },
    [loadWorkspace]
  );

  // 4. 가져온 워크스페이스를 폴더 없이 새로 연다. 저장할 폴더는 나중에 "보관함 열기"로 정한다.
  const openImportedTemporary = useCallback(
    async (workspace: Workspace): Promise<OpenImportedResult> => {
      try {
        await flushPendingSave();
      } catch (err: unknown) {
        console.error('가져오기 전 저장 오류:', err);
        return 'failed';
      }
      loadWorkspace(workspace, null, { dirty: true });
      setIsTemporary(true);
      setFailure(null);
      return 'opened';
    },
    [loadWorkspace]
  );

  return {
    isRestoring,
    isTemporary,
    isVaultSupported: isVaultSupported(),
    recentVaultName: recentVault?.name ?? null,
    openVault,
    reopenRecentVault,
    startTemporary,
    openImportedInVault,
    openImportedTemporary,
    failure,
    dismissFailure,
  };
}
