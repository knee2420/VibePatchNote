/**
 * @file useAutoSave.ts
 * @description File System Access API 기반 백그라운드 1초 디바운스 자동 저장 훅
 *
 * 저장 대상 파일은 스토어의 `fileHandle` 하나뿐이다. 이 훅은 핸들을 따로 보관하지 않는다.
 */

import { useEffect, useState } from 'react';
import { useTreeStore } from '@/entities/outline-document';
import { writeOutlineFile } from '../lib/outlineFile';

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'idle';

export function useAutoSave() {
  const document = useTreeStore((s) => s.document);
  const fileHandle = useTreeStore((s) => s.fileHandle);
  const isDirty = useTreeStore((s) => s.isDirty);
  const markClean = useTreeStore((s) => s.markClean);

  const [isSaving, setIsSaving] = useState(false);
  // 마지막 저장이 실패한 파일. 다른 파일로 바뀌면 실패 표시는 자연히 사라진다.
  const [failedHandle, setFailedHandle] = useState<FileSystemFileHandle | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isDirty || !fileHandle) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await writeOutlineFile(fileHandle, document);
        markClean();
        setFailedHandle(null);
        setLastSavedTime(Date.now());
      } catch (err) {
        console.error('자동 저장 실패:', err);
        setFailedHandle(fileHandle);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [document, fileHandle, isDirty, markClean]);

  let status: SaveStatus;
  if (isSaving) {
    status = 'saving';
  } else if (!isDirty) {
    status = fileHandle ? 'saved' : 'idle';
  } else if (fileHandle && failedHandle === fileHandle) {
    status = 'error';
  } else {
    status = 'dirty';
  }

  return {
    status,
    lastSavedTime,
  };
}
