import { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import type {
  DocumentElementItem,
  DocumentOutlineNode,
  ExtractOutlineResponse,
  ReferenceDocumentData,
} from './types';

interface UseDocumentOutlineOptions {
  nodeId: string;
  title: string;
  url?: string;
  initialOutlines?: DocumentOutlineNode[];
  initialElements?: DocumentElementItem[];
  initialIsOpen?: boolean;
  onSuccess?: (data: ExtractOutlineResponse) => void;
  onError?: (err: unknown) => void;
}

/**
 * useDocumentOutline (Entity Model Hook)
 *
 * 문서의 계층적 아웃라인과 세부 엘리먼트 추출 상태 및 패널 열림 상태를 관리합니다.
 * 백엔드 통신은 `referenceDocumentApi`에 완전히 위임합니다.
 */
export function useDocumentOutline({
  nodeId,
  title,
  url,
  initialOutlines,
  initialElements,
  initialIsOpen = false,
  onSuccess,
  onError,
}: UseDocumentOutlineOptions) {
  const [isExtractingOutline, setIsExtractingOutline] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(initialIsOpen);
  const [outlines, setOutlines] = useState<DocumentOutlineNode[]>(initialOutlines || []);
  const [elements, setElements] = useState<DocumentElementItem[]>(initialElements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const { setNodes } = useReactFlow();

  const optionsRef = useRef({ onSuccess, onError });
  useEffect(() => {
    optionsRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  const rawName = url ? url.split('/').pop() || title : title;
  const filename = decodeURIComponent(rawName);

  const extractOutline = useCallback(
    async (forceRefresh = false) => {
      if (!filename || isExtractingOutline) return;

      setIsExtractingOutline(true);

      try {
        const response = await referenceDocumentApi.extractOutline(filename, forceRefresh);
        const loadedOutlines = response.outlines || [];
        const loadedElements = response.elements || [];

        setOutlines(loadedOutlines);
        setElements(loadedElements);
        setIsOutlineOpen(true); // 추출 완료 시 패널 자동 오픈!

        // React Flow 노드 상태 동기화
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  outlines: loadedOutlines,
                  elements: loadedElements,
                  isOutlineOpen: true,
                } as ReferenceDocumentData,
              };
            }
            return node;
          })
        );

        optionsRef.current.onSuccess?.(response);
      } catch (err) {
        console.error('[useDocumentOutline] Extract outline failed:', err);
        optionsRef.current.onError?.(err);
      } finally {
        setIsExtractingOutline(false);
      }
    },
    [filename, isExtractingOutline, nodeId, setNodes]
  );

  const toggleOutlinePanel = useCallback(() => {
    setIsOutlineOpen((prev) => {
      const next = !prev;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                isOutlineOpen: next,
              } as ReferenceDocumentData,
            };
          }
          return node;
        })
      );
      return next;
    });
  }, [nodeId, setNodes]);

  return {
    isExtractingOutline,
    isOutlineOpen,
    outlines,
    elements,
    hasOutline: outlines.length > 0,
    selectedElementId,
    setSelectedElementId,
    extractOutline,
    toggleOutlinePanel,
  };
}
