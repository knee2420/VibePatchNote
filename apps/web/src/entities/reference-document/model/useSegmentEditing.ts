import { useCallback, useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

import { useDocumentScan } from './useDocumentScan';
import type { DocumentSegmentItem } from './types';

interface UseSegmentEditingOptions {
  /** 이 세그먼트들을 소유한 캔버스 노드 식별자. */
  nodeId: string;
  title: string;
  url?: string;
  initialSegments?: DocumentSegmentItem[];
  /** 스캔 완료/실패 알림은 헤드리스 훅이 아니라 호출한 UI 가 담당합니다. */
  onScanSuccess?: (segments: DocumentSegmentItem[]) => void;
  onScanError?: (error: unknown) => void;
}

/**
 * 문서 세그먼트의 스캔·편집·노드 반영을 담당하는 도메인 훅.
 *
 * 노드 데이터 갱신은 React Flow 의 `updateNodeData` 하나로만 합니다.
 * (컨트롤드 모드에서 이 호출은 `onNodesChange` 의 replace 변경으로 전파되어
 *  캔버스 스토어까지 그대로 반영되므로 별도의 전역 이벤트가 필요하지 않습니다.)
 */
export function useSegmentEditing({
  nodeId,
  title,
  url,
  initialSegments,
  onScanSuccess,
  onScanError,
}: UseSegmentEditingOptions) {
  const { updateNodeData } = useReactFlow();
  const [isEditMode, setIsEditMode] = useState(false);

  const syncSegmentsToNode = useCallback(
    (nextSegments: DocumentSegmentItem[]) => {
      updateNodeData(nodeId, { segments: nextSegments });
    },
    [nodeId, updateNodeData]
  );

  const { isScanning, segments, setSegments, scanDocument } = useDocumentScan({
    initialSegments,
    onSuccess: (loaded) => {
      syncSegmentsToNode(loaded);
      onScanSuccess?.(loaded);
    },
    onError: (error) => onScanError?.(error),
  });

  const filename = useMemo(() => {
    if (!url) return title;
    return url.split('?')[0].split('/').pop() || title;
  }, [url, title]);

  const scan = useCallback(() => {
    scanDocument(filename);
  }, [scanDocument, filename]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  /** setSegments 의 updater 안에서 부수효과를 부르지 않고, 계산된 결과만 커밋합니다. */
  const commit = useCallback(
    (project: (prev: DocumentSegmentItem[]) => DocumentSegmentItem[]) => {
      let next: DocumentSegmentItem[] = [];
      setSegments((prev) => {
        next = project(prev);
        return next;
      });
      syncSegmentsToNode(next);
    },
    [setSegments, syncSegmentsToNode]
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
    isEditMode,
    scan,
    toggleEditMode,
    updateSegment,
    createSegment,
    deleteSegment,
  };
}
