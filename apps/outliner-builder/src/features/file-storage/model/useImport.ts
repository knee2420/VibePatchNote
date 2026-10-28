/**
 * @file useImport.ts
 * @description 가져오기 창의 단계와 실행 훅
 *
 * 가져오는 것은 남의 데이터다. 지금 워크스페이스와 맞춰 보거나 섞지 않고,
 * `@vibe/outliner/dto` 가 구조만 확인해 만든 새 워크스페이스를 통째로 연다.
 */

import { useCallback, useState } from 'react';
import type { Workspace } from '@vibe/outliner/core';
import { type ImportFiles, type ImportResult, readImport } from '@vibe/outliner/dto';
import { useWorkspaceStore } from '@/entities/workspace';
import { isVaultSupported, pickImportDirectory, readJsonFilesDeep } from '../lib/vaultFs';
import type { OpenImportedResult } from './useFileIO';

export type ImportStage =
  | { kind: 'pick' }
  | { kind: 'preview'; sourceName: string; result: ImportResult };

export type ImportProblem = 'read-failed' | 'folder-not-empty' | 'open-failed';

interface UseImportOptions {
  onOpenInVault: (workspace: Workspace) => Promise<OpenImportedResult>;
  onOpenTemporary: (workspace: Workspace) => Promise<OpenImportedResult>;
  onOpened: () => void;
}

const FALLBACK_TITLE = '가져온 워크스페이스';

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

function pickJsonFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.multiple = true;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
}

export function useImport({ onOpenInVault, onOpenTemporary, onOpened }: UseImportOptions) {
  // 폴더에 묶이지 않은 채 고친 내용이 있으면, 새 워크스페이스를 여는 순간 사라진다.
  const hasUnsavedWork = useWorkspaceStore((s) => s.vaultHandle === null && s.isDirty);

  const [stage, setStage] = useState<ImportStage>({ kind: 'pick' });
  const [problem, setProblem] = useState<ImportProblem | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const preview = useCallback((files: ImportFiles, sourceName: string) => {
    setProblem(null);
    setStage({ kind: 'preview', sourceName, result: readImport(files, { title: sourceName }) });
  }, []);

  const pickFiles = useCallback(async () => {
    try {
      const picked = await pickJsonFiles();
      if (picked.length === 0) return;

      const files: ImportFiles = {};
      for (const file of picked) files[file.name] = await file.text();
      preview(files, picked.length === 1 ? picked[0].name.replace(/\.json$/i, '') : FALLBACK_TITLE);
    } catch (err: unknown) {
      console.error('파일 읽기 오류:', err);
      setProblem('read-failed');
    }
  }, [preview]);

  const pickFolder = useCallback(async () => {
    try {
      const folder = await pickImportDirectory();
      preview(await readJsonFilesDeep(folder), folder.name);
    } catch (err: unknown) {
      if (isAbort(err)) return;
      console.error('폴더 읽기 오류:', err);
      setProblem('read-failed');
    }
  }, [preview]);

  const pickAgain = useCallback(() => {
    setProblem(null);
    setStage({ kind: 'pick' });
  }, []);

  const open = useCallback(
    async (where: 'vault' | 'temporary') => {
      if (stage.kind !== 'preview' || !stage.result.workspace) return;

      setIsBusy(true);
      const outcome = await (where === 'vault' ? onOpenInVault : onOpenTemporary)(
        stage.result.workspace
      );
      setIsBusy(false);

      if (outcome === 'opened') onOpened();
      else if (outcome === 'folder-not-empty') setProblem('folder-not-empty');
      else if (outcome === 'failed') setProblem('open-failed');
    },
    [stage, onOpenInVault, onOpenTemporary, onOpened]
  );

  return {
    canPickFolder: isVaultSupported(),
    hasUnsavedWork,
    stage,
    problem,
    isBusy,
    pickFiles,
    pickFolder,
    pickAgain,
    open,
  };
}
