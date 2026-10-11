/**
 * @file useFileIO.ts
 * @description 로컬 파일 새로 만들기 / 열기 / 저장 / Export / Import 처리 훅
 *
 * 실패는 `failure` 상태로만 알린다. 어떻게 보여줄지는 UI 가 정한다.
 */

import { useCallback, useState } from 'react';
import { createEmptyDocument } from '@vibe/outliner-core';
import { useTreeStore } from '@/entities/outline-document';
import {
  type FileIOFailure,
  parseOutlineText,
  serializeOutlineDocument,
  writeOutlineFile,
} from '../lib/outlineFile';

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function useFileIO() {
  const loadDocument = useTreeStore((s) => s.loadDocument);
  const bindFile = useTreeStore((s) => s.bindFile);
  const [failure, setFailure] = useState<FileIOFailure | null>(null);

  const dismissFailure = useCallback(() => setFailure(null), []);

  // 파일 텍스트를 문서로 올린다. 어느 파일에 묶이는지를 항상 함께 정한다.
  const loadFromText = useCallback(
    (text: string, fileHandle: FileSystemFileHandle | null) => {
      const parsed = parseOutlineText(text);
      if (!parsed.success) {
        setFailure(parsed.failure);
        return false;
      }
      loadDocument(parsed.data, fileHandle);
      setFailure(null);
      return true;
    },
    [loadDocument]
  );

  // 1. 새 문서 (어느 파일에도 묶이지 않는다)
  const createNewDocument = useCallback(() => {
    loadDocument(createEmptyDocument(), null);
    setFailure(null);
  }, [loadDocument]);

  // 2. 고전적 파일 업로드 (Import / 폴백). 핸들을 얻을 수 없으므로 파일에 묶이지 않는다.
  const triggerClassicUpload = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        loadFromText(await file.text(), null);
      } catch (err: unknown) {
        console.error('파일 가져오기 오류:', err);
        setFailure({ kind: 'open-failed' });
      }
    };
    input.click();
  }, [loadFromText]);

  // 3. File System Access API로 로컬 파일 열기
  const openLocalFile = useCallback(async () => {
    if (!('showOpenFilePicker' in window)) {
      triggerClassicUpload();
      return false;
    }
    try {
      // @ts-expect-error window.showOpenFilePicker 모던 브라우저 API
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'JSON Document (*.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      return loadFromText(await file.text(), handle);
    } catch (err: unknown) {
      if (!isAbort(err)) {
        console.error('파일 열기 오류:', err);
        setFailure({ kind: 'open-failed' });
      }
      return false;
    }
  }, [loadFromText, triggerClassicUpload]);

  // 4. 순수 Blob JSON 다운로드 (Export)
  const exportJson = useCallback(() => {
    const { document } = useTreeStore.getState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(serializeOutlineDocument(document));
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${document.title || 'outline'}.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  // 5. 다른 이름으로 로컬 파일 저장
  const saveAsLocalFile = useCallback(async () => {
    if (!('showSaveFilePicker' in window)) {
      exportJson();
      return false;
    }
    try {
      // @ts-expect-error window.showSaveFilePicker 모던 브라우저 API
      const handle = await window.showSaveFilePicker({
        suggestedName: `${useTreeStore.getState().document.title || 'outline'}.json`,
        types: [
          {
            description: 'JSON Document (*.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      await writeOutlineFile(handle, useTreeStore.getState().document);
      bindFile(handle);
      setFailure(null);
      return true;
    } catch (err: unknown) {
      if (!isAbort(err)) {
        console.error('파일 저장 오류:', err);
        setFailure({ kind: 'save-failed' });
      }
      return false;
    }
  }, [bindFile, exportJson]);

  return {
    createNewDocument,
    openLocalFile,
    saveAsLocalFile,
    exportJson,
    triggerClassicUpload,
    failure,
    dismissFailure,
  };
}
