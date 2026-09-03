import { useState, useRef, useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

import { fileDropRegistry } from './fileDropRegistry';
import { uploadFileToNode } from './uploadFileToNode';

interface UseCanvasFileDropProps {
  onNodeCreated?: (node: Node) => void;
  /** 파일 단위 업로드 실패를 UI에 알립니다. (알림 표시는 호출부 책임) */
  onUploadError?: (file: File, error: unknown) => void;
}

/** 캔버스 드래그&드롭 업로드의 헤드리스 로직. */
export function useCanvasFileDrop({ onNodeCreated, onUploadError }: UseCanvasFileDropProps = {}) {
  const { screenToFlowPosition } = useReactFlow();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDraggingOver) {
        setIsDraggingOver(true);
      }
    },
    [isDraggingOver]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const basePosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      setIsUploading(true);

      for (const [index, file] of files.entries()) {
        // 여러 파일을 한 번에 놓으면 겹치지 않도록 계단식으로 배치합니다.
        const position = {
          x: basePosition.x + index * 40,
          y: basePosition.y + index * 40,
        };

        try {
          const node = await uploadFileToNode(file, position);
          if (node) onNodeCreated?.(node);
        } catch (error) {
          console.error(`[useCanvasFileDrop] Upload failed for ${file.name}:`, error);
          onUploadError?.(file, error);
        }
      }

      setIsUploading(false);
    },
    [screenToFlowPosition, onNodeCreated, onUploadError]
  );

  return {
    isDraggingOver,
    isUploading,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    supportedExtensions: fileDropRegistry.getAllSupportedExtensions(),
  };
}
