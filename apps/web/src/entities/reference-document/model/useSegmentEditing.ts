import { useCallback, useEffect, useRef, useState } from 'react';

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
  onSegmentSaved?: () => void;
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
  onSegmentSaved,
}: UseSegmentEditingOptions) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isScanning, segments, artifactId, setArtifactId, setSegments, execution, scanDocument } = useDocumentScan({
    docId,
    onSuccess: (loaded) => onScanSuccess?.(loaded),
    onError: (error) => onScanError?.(error),
  });
  const segmentsRef = useRef(segments);
  const artifactIdRef = useRef(artifactId);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { artifactIdRef.current = artifactId; }, [artifactId]);

  const scan = useCallback(() => {
    void scanDocument();
  }, [scanDocument]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  /** 편집 결과를 새 아티팩트로 커밋합니다. */
  const persist = useCallback(
    (next: DocumentSegmentItem[]) => {
      if (!docId) return;
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        setIsSaving(true);
        try {
          const saved = await referenceDocumentApi.saveSegments(docId, artifactIdRef.current, next);
          const nextArtifactId = saved.artifactId || null;
          artifactIdRef.current = nextArtifactId;
          setArtifactId(nextArtifactId);
          onSegmentSaved?.();
        } catch (error) {
          console.error('[useSegmentEditing] 세그먼트 저장 실패:', error);
        } finally {
          setIsSaving(false);
        }
      });
    },
    [docId, setArtifactId, onSegmentSaved]
  );

  /** setSegments 의 updater 안에서 부수효과를 부르지 않고, 계산된 결과만 커밋합니다. */
  const commit = useCallback(
    (project: (prev: DocumentSegmentItem[]) => DocumentSegmentItem[]) => {
      const next = project(segmentsRef.current);
      segmentsRef.current = next;
      setSegments(next);
      persist(next);
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

  const splitSegment = useCallback(
    (segmentId: string, axis: 'horizontal' | 'vertical') =>
      commit((prev) => {
        const target = prev.find((segment) => segment.id === segmentId);
        if (!target) return prev;
        const [ymin, xmin, ymax, xmax] = target.box_2d;
        const midpoint = axis === 'horizontal' ? Math.round((ymin + ymax) / 2) : Math.round((xmin + xmax) / 2);
        if ((axis === 'horizontal' && midpoint <= ymin) || (axis === 'vertical' && midpoint <= xmin)) return prev;
        const firstBox: DocumentSegmentItem['box_2d'] = axis === 'horizontal'
          ? [ymin, xmin, midpoint, xmax]
          : [ymin, xmin, ymax, midpoint];
        const secondBox: DocumentSegmentItem['box_2d'] = axis === 'horizontal'
          ? [midpoint, xmin, ymax, xmax]
          : [ymin, midpoint, ymax, xmax];
        const suffix = axis === 'horizontal' ? '상단' : '좌측';
        const nextId = `${target.id}-split-${Date.now()}`;
        const replacement = [
          { ...target, label: `${target.label} (${suffix})`, box_2d: firstBox },
          { ...target, id: nextId, label: `${target.label} (${axis === 'horizontal' ? '하단' : '우측'})`, box_2d: secondBox },
        ];
        return prev.flatMap((segment) => segment.id === segmentId ? replacement : [segment]);
      }),
    [commit],
  );

  const mergeSegments = useCallback(
    (segmentIds: string[]) =>
      commit((prev) => {
        const selected = prev.filter((segment) => segmentIds.includes(segment.id));
        if (selected.length < 2 || new Set(selected.map((segment) => segment.page)).size !== 1) return prev;
        const [first, ...rest] = selected;
        const merged: DocumentSegmentItem = {
          ...first,
          label: `${first.label} 외 ${selected.length - 1}개`,
          box_2d: [
            Math.min(...selected.map((segment) => segment.box_2d[0])),
            Math.min(...selected.map((segment) => segment.box_2d[1])),
            Math.max(...selected.map((segment) => segment.box_2d[2])),
            Math.max(...selected.map((segment) => segment.box_2d[3])),
          ],
          content_summary: [first.content_summary, ...rest.map((segment) => segment.content_summary)]
            .filter(Boolean).join(' '),
        };
        return prev.flatMap((segment) => segment.id === first.id ? [merged] : segmentIds.includes(segment.id) ? [] : [segment]);
      }),
    [commit],
  );

  return {
    segments,
    artifactId,
    isScanning,
    execution,
    isSaving,
    isEditMode,
    scan,
    toggleEditMode,
    updateSegment,
    createSegment,
    deleteSegment,
    splitSegment,
    mergeSegments,
  };
}
