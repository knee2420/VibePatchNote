import { useState, useCallback, useEffect, useRef } from 'react';

import { HttpError } from '@/shared/api';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import type { DocumentSegmentItem } from './types';

interface UseDocumentScanOptions {
  /** 문서 식별자. 세그먼트는 이 포인터로만 조회·생성합니다. */
  docId?: string;
  onSuccess?: (segments: DocumentSegmentItem[]) => void;
  onError?: (error: unknown) => void;
}

/**
 * 문서 영역 스캔 상태 및 비즈니스 액션을 관리하는 도메인 훅.
 *
 * **세그먼트는 노드에 저장하지 않습니다.** 정본은 백엔드 아티팩트 저장소가 갖고 있고,
 * 이 훅이 마운트될 때 채택본을 한 번 읽어 옵니다(LLM 미개입).
 */
export function useDocumentScan(options: UseDocumentScanOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [segments, setSegments] = useState<DocumentSegmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const { docId } = options;

  // 채택본은 한 번만 읽는다. 매 렌더마다 읽으면 편집 중인 값을 덮어쓴다.
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!docId || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    void (async () => {
      try {
        const adopted = await referenceDocumentApi.getSegments(docId);
        setSegments(adopted.segments || []);
      } catch (err) {
        // 404 는 "아직 스캔하지 않았다"는 정상 상태다.
        if (err instanceof HttpError && err.status === 404) return;
        console.error('[useDocumentScan] 채택본 조회 실패:', err);
      }
    })();
  }, [docId]);

  const scanDocument = useCallback(async () => {
    if (!docId || isScanning) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await referenceDocumentApi.scanSegments(docId);
      const loadedSegments = response.segments || [];
      setSegments(loadedSegments);
      optionsRef.current.onSuccess?.(loadedSegments);
    } catch (err) {
      console.error('Document scan failed:', err);
      setError('문서 구조 스캔에 실패했습니다.');
      optionsRef.current.onError?.(err);
    } finally {
      setIsScanning(false);
    }
  }, [docId, isScanning]);

  return {
    isScanning,
    segments,
    setSegments,
    error,
    scanDocument,
  };
}
