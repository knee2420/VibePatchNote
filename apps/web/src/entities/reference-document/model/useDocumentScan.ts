import { useState, useCallback } from 'react';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import type { DocumentSegmentItem } from './types';

interface UseDocumentScanOptions {
  onSuccess?: (segments: DocumentSegmentItem[]) => void;
  onError?: (error: unknown) => void;
}

/**
 * 문서 영역 스캔 상태 및 비즈니스 액션을 관리하는 도메인 훅.
 * 백엔드 통신은 `referenceDocumentApi`에 완전히 위임합니다.
 */
export function useDocumentScan(options: UseDocumentScanOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [segments, setSegments] = useState<DocumentSegmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanDocument = useCallback(
    async (filename: string) => {
      if (!filename || isScanning) return;

      setIsScanning(true);
      setError(null);

      try {
        const response = await referenceDocumentApi.scanSegments(filename);
        const loadedSegments = response.segments || [];
        setSegments(loadedSegments);
        options.onSuccess?.(loadedSegments);
      } catch (err) {
        console.error('Document scan failed:', err);
        const errorMsg = '문서 구조 스캔에 실패했습니다.';
        setError(errorMsg);
        options.onError?.(err);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, options]
  );

  return {
    isScanning,
    segments,
    setSegments,
    error,
    scanDocument,
  };
}
