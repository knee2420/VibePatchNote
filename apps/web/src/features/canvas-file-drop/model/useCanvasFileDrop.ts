import { useState, useRef, useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

import { fileDropRegistry } from './fileDropRegistry';
import { uploadDocumentApi } from '../api/uploadDocumentApi';

interface UseCanvasFileDropProps {
  onNodeCreated?: (node: Node) => void;
}

export function useCanvasFileDrop({ onNodeCreated }: UseCanvasFileDropProps = {}) {
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  }, [isDraggingOver]);

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

      const basePosition = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      setIsUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const offsetPosition = {
          x: basePosition.x + i * 40,
          y: basePosition.y + i * 40,
        };

        const handler = fileDropRegistry.getHandler(file);
        if (!handler) {
          console.warn(`[useCanvasFileDrop] No handler found for file: ${file.name}`);
          continue;
        }

        try {
          const uploadResult = await uploadDocumentApi(file);
          const newNode = handler.createNode({
            file,
            uploadResult,
            position: offsetPosition,
          });

          onNodeCreated?.(newNode);
        } catch (error) {
          console.error(`[useCanvasFileDrop] Upload failed for ${file.name}:`, error);
          alert(`[${file.name}] 파일 업로드 중 오류가 발생했습니다.`);
        }
      }

      setIsUploading(false);
    },
    [screenToFlowPosition, onNodeCreated]
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
