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
  const [outlineProgressStep, setOutlineProgressStep] = useState<number>(1);
  const [outlineProgressMessage, setOutlineProgressMessage] = useState<string>('');
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
      setIsOutlineOpen(true); // 0ms 즉각 패널 오픈!
      setOutlineProgressStep(1);
      setOutlineProgressMessage('📄 [1/3] PDF 시각 기하(표·타이포·로고) 실측 중...');

      // 단계별 진행 시뮬레이션 타이머 (체감 UX 향상)
      const timers: NodeJS.Timeout[] = [];
      timers.push(
        setTimeout(() => {
          setOutlineProgressStep(2);
          setOutlineProgressMessage('🤖 [2/3] Gemini 모델이 L1~L4 계층 구조 및 컴포넌트 인지 분해 중...');
        }, 2500)
      );

      timers.push(
        setTimeout(() => {
          setOutlineProgressStep(3);
          setOutlineProgressMessage('🧩 [3/3] 컴포넌트(Company Logo, Key-Value) 실측값 바인딩 중...');
        }, 6500)
      );

      try {
        const response = await referenceDocumentApi.extractOutline(filename, forceRefresh);
        timers.forEach(clearTimeout);

        const loadedOutlines = response.outlines || [];
        const loadedElements = response.elements || [];

        setOutlineProgressStep(3);
        setOutlineProgressMessage('✓ 분석 완료! 목차 트리를 표시합니다.');
        setOutlines(loadedOutlines);
        setElements(loadedElements);
        setIsOutlineOpen(true);

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
        timers.forEach(clearTimeout);
        console.error('[useDocumentOutline] Extract outline failed:', err);
        setOutlineProgressMessage('❌ 아웃라인 분석 중 오류가 발생했습니다.');
        optionsRef.current.onError?.(err);
      } finally {
        setTimeout(() => {
          setIsExtractingOutline(false);
        }, 600);
      }
    },
    [filename, isExtractingOutline, nodeId, setNodes]
  );

  const toggleOutlinePanel = useCallback(() => {
    setIsOutlineOpen((prev) => {
      const next = !prev;
      // React 19: BatchProvider setState 충돌 방지를 위해 setNodes를 updater 바깥 비동기 마이크로태스크로 분리
      queueMicrotask(() => {
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
      });
      return next;
    });
  }, [nodeId, setNodes]);

  return {
    isExtractingOutline,
    outlineProgressStep,
    outlineProgressMessage,
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
