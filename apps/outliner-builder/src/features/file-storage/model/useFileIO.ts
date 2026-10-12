/**
 * @file useFileIO.ts
 * @description 보관함 열기 / 다시 열기 / 가져오기 / 내보내기 처리 훅
 *
 * 저장 버튼은 없다. 폴더 하나를 보관함으로 고르면 이후 변경은 `useAutoSave` 가 알아서 기록한다.
 * 이 훅은 "어느 폴더에 묶을지"와 "단일 파일로 주고받기"만 다룬다.
 */

import { useCallback, useEffect, useState } from 'react';
import { createEmptyWorkspace, serializeWorkspace } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';
import { type FileIOFailure, parseWorkspaceText } from '../lib/outlineFile';
import {
  hasVaultPermission,
  isVaultSupported,
  pickVaultDirectory,
  requestVaultPermission,
} from '../lib/vaultFs';
import { recallVault, rememberVault } from '../lib/vaultRegistry';
import { needsVaultSync, readVault } from '../lib/vaultSession';

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function useFileIO() {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const bindVault = useWorkspaceStore((s) => s.bindVault);
  const importWorkspace = useWorkspaceStore((s) => s.importWorkspace);

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
        if (result.workspace) {
          loadWorkspace(result.workspace, handle, {
            dirty: needsVaultSync(handle, result.workspace),
          });
        } else if (!vaultHandle && isDirty) {
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

  // 3. 단일 .json 파일의 프로젝트들을 지금 워크스페이스에 더하기 (가져오기)
  const importJson = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = parseWorkspaceText(await file.text());
        if (!parsed.success) {
          setFailure(parsed.failure);
          return;
        }
        const importedCount = importWorkspace(parsed.data);
        setFailure(importedCount === 0 ? { kind: 'nothing-to-import' } : null);
      } catch (err: unknown) {
        console.error('파일 가져오기 오류:', err);
        setFailure({ kind: 'open-failed' });
      }
    };
    input.click();
  }, [importWorkspace]);

  // 4. 워크스페이스 전체를 단일 .json 파일로 내려받기 (내보내기)
  const exportJson = useCallback(() => {
    const { workspace } = useWorkspaceStore.getState();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(serializeWorkspace(workspace));
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workspace.title || 'workspace'}.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  return {
    isRestoring,
    isTemporary,
    isVaultSupported: isVaultSupported(),
    recentVaultName: recentVault?.name ?? null,
    openVault,
    reopenRecentVault,
    startTemporary,
    importJson,
    exportJson,
    failure,
    dismissFailure,
  };
}
