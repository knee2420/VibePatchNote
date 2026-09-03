import { useCallback, useRef, useState } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { uploadFileToNode } from '@/features/canvas-file-drop';

function randomBoardPosition() {
  return {
    x: Math.random() * 100 + 100,
    y: Math.random() * 100 + 100,
  };
}

interface UseBoardFileUploadOptions {
  onSuccess?: (file: File) => void;
  onError?: (file: File, error: unknown) => void;
}

/**
 * 툴바의 업로드 버튼(파일 선택 다이얼로그) 경로를 담당합니다.
 * 드래그&드롭 경로는 `features/canvas-file-drop` 이 별도로 처리하며,
 * 업로드→노드 생성 절차 자체는 두 경로가 같은 함수를 공유합니다.
 */
export function useBoardFileUpload({ onSuccess, onError }: UseBoardFileUploadOptions = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const addNode = useCanvasBoardStore((s) => s.addNode);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const node = await uploadFileToNode(file, randomBoardPosition());
        if (!node) {
          onError?.(file, new Error(`지원하지 않는 파일 형식입니다: ${file.name}`));
          return;
        }

        addNode(node);
        onSuccess?.(file);
      } catch (error) {
        console.error('File upload error:', error);
        onError?.(file, error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [addNode, onError, onSuccess]
  );

  return { fileInputRef, isUploading, openFilePicker, handleFileChange };
}
