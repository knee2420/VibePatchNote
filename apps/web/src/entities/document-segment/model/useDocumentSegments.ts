import { useState, useCallback, useEffect, useRef } from 'react';

import { followAgentRun, HttpError, type AgentRunExecution } from '@/shared/api';

import { segmentApi } from '../api/segmentApi';
import type { DocumentSegmentItem, SegmentArtifactResponse } from './types';

interface UseDocumentSegmentsOptions {
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
export function useDocumentSegments(options: UseDocumentSegmentsOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [segments, setSegments] = useState<DocumentSegmentItem[]>([]);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [execution, setExecution] = useState<AgentRunExecution | null>(null);

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
        const adopted = await segmentApi.getSegments(docId);
        setSegments(adopted.segments || []);
        setArtifactId(adopted.artifactId || null);
      } catch (err) {
        // 현재 API는 미생성 세그먼트를 빈 목록으로 돌려준다. 404는 문서가
        // 삭제되는 등의 경쟁 상태에서만 가능하므로 조용히 무시한다.
        if (err instanceof HttpError && err.status === 404) return;
        console.error('[useDocumentSegments] 채택본 조회 실패:', err);
      }
    })();
  }, [docId]);

  const scanDocument = useCallback(async () => {
    if (!docId || isScanning) return;

    setIsScanning(true);
    setError(null);
    setExecution(null);

    try {
      const accepted = await segmentApi.startScan(docId);
      const settled = await followAgentRun<SegmentArtifactResponse>(
        accepted.runId,
        (current) => setExecution(current.execution ?? null),
      );
      if (settled.status !== 'completed' || !settled.result) {
        throw new Error(settled.errorCode || '문서 구조 스캔 작업이 완료되지 않았습니다.');
      }
      const response = settled.result;
      const loadedSegments = response.segments || [];
      setSegments(loadedSegments);
      setArtifactId(response.artifactId || null);
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
    artifactId,
    setArtifactId,
    setSegments,
    error,
    execution,
    scanDocument,
  };
}
