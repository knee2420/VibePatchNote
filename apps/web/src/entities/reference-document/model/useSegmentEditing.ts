import { useCallback, useState } from 'react';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import { useDocumentScan } from './useDocumentScan';
import type { DocumentSegmentItem } from './types';

interface UseSegmentEditingOptions {
  /** 이 세그먼트들을 소유한 캔버스 노드 식별자. */
  nodeId: string;
  /** 문서 식별자. 세그먼트의 정본은 이 문서의 아티팩트다. */
  docId?: string;
  /** 스캔 완료/실패 알림은 헤드리스 훅이 아니라 호출한 UI 가 담당합니다. */
  onScanSuccess?: (segments: DocumentSegmentItem[]) => void;
  onScanError?: (error: unknown) => void;
}

/**
 * 문서 세그먼트의 스캔·편집·저장을 담당하는 도메인 훅.
 *
 * **편집 결과는 노드가 아니라 백엔드 아티팩트에 저장합니다.** 사람이 손으로 고친
 * 좌표는 파생물이 아니라 저작물입니다. 노드 데이터에만 두면 재분석하는 순간
 * 조용히 사라지고, 세션 파일에 사본이 쌓입니다.
 */
export function useSegmentEditing({
  nodeId: _nodeId,
  docId,
  onScanSuccess,
  onScanError,
}: UseSegmentEditingOptions) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isScanning, segments, setSegments, execution, scanDocument } = useDocumentScan({
    docId,
    onSuccess: (loaded) => onScanSuccess?.(loaded),
    onError: (error) => onScanError?.(error),
  });

  const scan = useCallback(() => {
    void scanDocument();
  }, [scanDocument]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  /** 편집 결과를 새 아티팩트로 커밋합니다. */
  const persist = useCallback(
    async (next: DocumentSegmentItem[]) => {
      if (!docId) return;
      setIsSaving(true);
      try {
        await referenceDocumentApi.saveSegments(docId, next);
      } catch (error) {
        console.error('[useSegmentEditing] 세그먼트 저장 실패:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [docId]
  );

  /** setSegments 의 updater 안에서 부수효과를 부르지 않고, 계산된 결과만 커밋합니다. */
  const commit = useCallback(
    (project: (prev: DocumentSegmentItem[]) => DocumentSegmentItem[]) => {
      let next: DocumentSegmentItem[] = [];
      setSegments((prev) => {
        next = project(prev);
        return next;
      });
      void persist(next);
    },
    [setSegments, persist]
  );

  const updateSegment = useCallback(
    (updated: DocumentSegmentItem) =>
      commit((prev) => prev.map((s) => (s.id === updated.id ? updated : s))),
    [commit]
  );

  const createSegment = useCallback(
    (created: DocumentSegmentItem) => commit((prev) => [...prev, created]),
    [commit]
  );

  const deleteSegment = useCallback(
    (segmentId: string) => commit((prev) => prev.filter((s) => s.id !== segmentId)),
    [commit]
  );

  return {
    segments,
    isScanning,
    execution,
    isSaving,
    isEditMode,
    scan,
    toggleEditMode,
    updateSegment,
    createSegment,
    deleteSegment,
  };
}
