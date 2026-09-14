import { useCallback, useEffect, useRef, useState } from 'react';

import { segmentApi } from '../api/segmentApi';
import { planMerge, type MergeBlockedReason } from './mergePlan';
import type { DocumentSegmentItem } from './types';
import { useDocumentSegments } from './useDocumentSegments';

/** 되돌리기 이력 상한. 한 세션에서 이보다 더 거슬러 올라갈 일은 없다. */
const HISTORY_LIMIT = 50;

interface UseSegmentEditingOptions {
  /** 이 세그먼트들을 소유한 캔버스 노드 식별자. */
  nodeId: string;
  /** 문서 식별자. 세그먼트의 정본은 이 문서의 아티팩트다. */
  docId?: string;
  /** 스캔 완료/실패 알림은 헤드리스 훅이 아니라 호출한 UI 가 담당합니다. */
  onScanSuccess?: (segments: DocumentSegmentItem[]) => void;
  onScanError?: (error: unknown) => void;
  onSegmentSaved?: () => void;
  /** 병합이 조건에 안 맞아 실행되지 않았을 때. 조용히 무시하면 버튼 고장으로 보인다. */
  onMergeBlocked?: (reason: MergeBlockedReason) => void;
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
  onMergeBlocked,
}: UseSegmentEditingOptions) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isScanning, segments, artifactId, setArtifactId, setSegments, execution, scanDocument } = useDocumentSegments({
    docId,
    onSuccess: (loaded) => onScanSuccess?.(loaded),
    onError: (error) => onScanError?.(error),
  });
  const segmentsRef = useRef(segments);
  const artifactIdRef = useRef(artifactId);
  const saveQueueRef = useRef(Promise.resolve());

  /**
   * 되돌리기 이력.
   *
   * 분할·병합·삭제는 한 번 누르면 확정이라 실수를 손으로 복구해야 했다. 각 명령
   * **직전 상태**를 쌓아 두고, 되돌리면 그 상태를 다시 커밋한다. 새 리비전을 만드는
   * 방식이라 "되돌렸다"는 사실도 이력에 남는다 — 조용히 과거를 덮어쓰지 않는다.
   */
  const undoStackRef = useRef<DocumentSegmentItem[][]>([]);
  const redoStackRef = useRef<DocumentSegmentItem[][]>([]);
  const [historyDepth, setHistoryDepth] = useState({ undo: 0, redo: 0 });
  const syncHistoryDepth = useCallback(() => {
    setHistoryDepth({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }, []);

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
          const saved = await segmentApi.saveSegments(docId, artifactIdRef.current, next);
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
      const previous = segmentsRef.current;
      const next = project(previous);
      // 아무것도 안 바뀐 명령은 이력에 남기지 않는다. 되돌리기를 눌렀는데 화면이
      // 그대로인 일이 생기면 사용자는 기능이 고장났다고 본다.
      if (next === previous) return;
      undoStackRef.current = [...undoStackRef.current, previous].slice(-HISTORY_LIMIT);
      redoStackRef.current = [];
      syncHistoryDepth();
      segmentsRef.current = next;
      setSegments(next);
      persist(next);
    },
    [setSegments, persist, syncHistoryDepth]
  );

  /** 이력을 건드리지 않고 특정 상태로 되돌린다. */
  const restore = useCallback(
    (snapshot: DocumentSegmentItem[]) => {
      segmentsRef.current = snapshot;
      setSegments(snapshot);
      persist(snapshot);
    },
    [setSegments, persist]
  );

  const undo = useCallback(() => {
    const previous = undoStackRef.current.at(-1);
    if (!previous) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, segmentsRef.current].slice(-HISTORY_LIMIT);
    syncHistoryDepth();
    restore(previous);
  }, [restore, syncHistoryDepth]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.at(-1);
    if (!next) return;
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, segmentsRef.current].slice(-HISTORY_LIMIT);
    syncHistoryDepth();
    restore(next);
  }, [restore, syncHistoryDepth]);

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

  /**
   * 세그먼트를 둘로 나눈다.
   *
   * `position` 은 화면에서 고른 자리다. 넘어오지 않으면 정중앙에서 나누지만, 그
   * 자리는 내용과 무관해 표의 행 한가운데를 지나가기 쉽다.
   */
  const splitSegment = useCallback(
    (segmentId: string, axis: 'horizontal' | 'vertical', position?: number) =>
      commit((prev) => {
        const target = prev.find((segment) => segment.id === segmentId);
        if (!target) return prev;
        const [ymin, xmin, ymax, xmax] = target.box_2d;
        const low = axis === 'horizontal' ? ymin : xmin;
        const high = axis === 'horizontal' ? ymax : xmax;
        const cut = Math.round(position ?? (low + high) / 2);
        // 가장자리에 붙은 분할은 한쪽이 0 넓이가 되어 저장 단계에서 거부된다.
        if (cut <= low || cut >= high) return prev;
        const firstBox: DocumentSegmentItem['box_2d'] = axis === 'horizontal'
          ? [ymin, xmin, cut, xmax]
          : [ymin, xmin, ymax, cut];
        const secondBox: DocumentSegmentItem['box_2d'] = axis === 'horizontal'
          ? [cut, xmin, ymax, xmax]
          : [ymin, cut, ymax, xmax];
        const nextId = `${target.id}-split-${Date.now()}`;
        const replacement = [
          { ...target, label: `${target.label} (${axis === 'horizontal' ? '상단' : '좌측'})`, box_2d: firstBox },
          { ...target, id: nextId, label: `${target.label} (${axis === 'horizontal' ? '하단' : '우측'})`, box_2d: secondBox },
        ];
        return prev.flatMap((segment) => segment.id === segmentId ? replacement : [segment]);
      }),
    [commit],
  );

  /**
   * 고른 것들을 **한 영역으로** 합친다.
   *
   * 세그먼트는 연속된 한 영역이다. 그래서 고른 것들 사이에 있던 세그먼트도 같은
   * 영역이 되며, 남겨 두면 새 박스와 겹친다. `planMerge` 가 흡수 대상까지 정하고,
   * 화면은 실행 전에 같은 계산으로 미리 보여 준다.
   */
  const mergeSegments = useCallback(
    (segmentIds: string[]) => {
      const plan = planMerge(segmentsRef.current, segmentIds);
      if (!plan.ok || !plan.box) {
        if (plan.reason) onMergeBlocked?.(plan.reason);
        return;
      }
      const removed = new Set([...plan.selectedIds, ...plan.absorbedIds]);
      commit((prev) => {
        const selected = prev.filter((segment) => plan.selectedIds.includes(segment.id));
        const [first, ...rest] = selected;
        const merged: DocumentSegmentItem = {
          ...first,
          box_2d: plan.box as [number, number, number, number],
          content_summary: [first.content_summary, ...rest.map((segment) => segment.content_summary)]
            .filter(Boolean)
            .join(' ') || undefined,
        };
        return prev.flatMap((segment) =>
          segment.id === first.id ? [merged] : removed.has(segment.id) ? [] : [segment]
        );
      });
    },
    [commit, onMergeBlocked]
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
    undo,
    redo,
    canUndo: historyDepth.undo > 0,
    canRedo: historyDepth.redo > 0,
  };
}
