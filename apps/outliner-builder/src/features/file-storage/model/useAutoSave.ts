/**
 * @file useAutoSave.ts
 * @description 보관함 폴더 기반 백그라운드 1초 디바운스 자동 저장 훅
 *
 * 파이프라인은 하나뿐이다: 워크스페이스 변경 감지 -> 묶인 보관함에 맞추기(sync).
 * 무엇이 바뀌었는지(불릿·프로젝트 구조)는 알지 못하고, 워크스페이스 전체를 넘긴다.
 * 어느 파일을 쓰고 지울지는 `@vibe/outliner-dto` 가 디스크와 비교해 정한다.
 * 저장 대상은 스토어의 `vaultHandle` 하나뿐이다. 이 훅은 핸들을 따로 보관하지 않는다.
 */

import { useEffect, useRef, useState } from 'react';
import type { Workspace } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';
import { syncVault } from '../lib/vaultSession';

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'idle';

const DEBOUNCE_MS = 1000;

export function useAutoSave() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const vaultHandle = useWorkspaceStore((s) => s.vaultHandle);
  const isDirty = useWorkspaceStore((s) => s.isDirty);
  const markClean = useWorkspaceStore((s) => s.markClean);

  const [isSaving, setIsSaving] = useState(false);
  // 마지막 저장이 실패한 보관함과 내용. 다른 보관함으로 바뀌면 실패 표시는 자연히 사라지고,
  // 내용이 바뀌기 전까지는 같은 기록을 되풀이해 시도하지 않는다.
  const [failed, setFailed] = useState<{
    handle: FileSystemDirectoryHandle;
    workspace: Workspace;
  } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  // 보관함을 막 열었거나 프로젝트를 전환한 직후에는 기다리지 않고 즉시 기록한다.
  const lastContext = useRef({ vaultHandle, activeProjectId: workspace.activeProjectId });

  useEffect(() => {
    const isNewContext =
      lastContext.current.vaultHandle !== vaultHandle ||
      lastContext.current.activeProjectId !== workspace.activeProjectId;
    lastContext.current = { vaultHandle, activeProjectId: workspace.activeProjectId };

    // 기록 중에는 새 기록을 겹쳐 시작하지 않는다. 끝나면 이 효과가 다시 돌아 남은 변경을 이어서 쓴다.
    if (!isDirty || !vaultHandle || isSaving) return;
    if (failed?.handle === vaultHandle && failed.workspace === workspace) return;

    const timer = setTimeout(
      async () => {
        setIsSaving(true);
        try {
          await syncVault(vaultHandle, workspace);
          markClean(workspace);
          setFailed(null);
          setLastSavedTime(Date.now());
        } catch (err) {
          console.error('자동 저장 실패:', err);
          setFailed({ handle: vaultHandle, workspace });
        } finally {
          setIsSaving(false);
        }
      },
      isNewContext ? 0 : DEBOUNCE_MS
    );

    return () => clearTimeout(timer);
  }, [workspace, vaultHandle, isDirty, isSaving, failed, markClean]);

  let status: SaveStatus;
  if (isSaving) {
    status = 'saving';
  } else if (!isDirty) {
    status = vaultHandle ? 'saved' : 'idle';
  } else if (vaultHandle && failed?.handle === vaultHandle) {
    status = 'error';
  } else {
    status = 'dirty';
  }

  return {
    status,
    lastSavedTime,
  };
}
