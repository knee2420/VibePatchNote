import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ViewerSegment } from '../../../types';
import { useSegmentTypes, useViewerLabels } from '../../../viewerConfig';
import {
  clientToNormalized,
  isDrawableBox,
  NORMALIZED_MAX,
  normalizeDragRect,
  type ContainerRect,
  type Point,
  type ResizeHandle,
  type SegmentBox,
} from './geometry';
import { resizeSegmentBox } from './resizeSegmentBox';
import { buildSnapAnchors, snapPoint } from './snapping';
import { useShiftKey } from './useShiftKey';

interface ResizingState {
  handle: ResizeHandle;
  segmentId: string;
  initialBox: SegmentBox;
  /** 드래그 중에는 상위 스토어를 건드리지 않고 이 초안만 60fps 로 갱신합니다. */
  draftBox: SegmentBox;
  startClientX: number;
  startClientY: number;
}

interface UseSegmentDragOptions {
  pageNumber: number;
  pageSegments: ViewerSegment[];
  textLines?: number[];
  isEditMode: boolean;
  enableSnap: boolean;
  setSelectedId: (id: string | null) => void;
  onSelectSegment?: (segment: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onSplitSegment?: (segmentId: string, axis: 'horizontal' | 'vertical', position: number) => void;
}

/**
 * 세그먼트의 신규 생성(Shift + 드래그)과 이동/리사이즈를 담당합니다.
 *
 * 드래그 중에는 로컬 draftBox 만 갱신하고, 마우스를 놓는 순간 단 한 번
 * `onUpdateSegment` 로 커밋합니다. (상위 캔버스 스토어 재렌더 폭주 방지)
 */
export function useSegmentDrag({
  pageNumber,
  pageSegments,
  textLines,
  isEditMode,
  enableSnap,
  setSelectedId,
  onSelectSegment,
  onCreateSegment,
  onUpdateSegment,
  onSplitSegment,
}: UseSegmentDragOptions) {
  // 새 영역의 기본 타입·라벨도 호스트가 정한다. 패키지가 'section' 같은 도메인
  // 어휘나 한국어 라벨을 직접 고르면, 다른 호스트에서는 없는 타입이 만들어진다.
  const labels = useViewerLabels();
  const segmentTypes = useSegmentTypes();
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** 드래그 시작 시 1회만 캐시해 매 프레임 강제 리플로우를 막습니다. */
  const containerRectRef = useRef<ContainerRect | null>(null);

  const onUpdateSegmentRef = useRef(onUpdateSegment);
  onUpdateSegmentRef.current = onUpdateSegment;

  const pageSegmentsRef = useRef<ViewerSegment[]>(pageSegments);
  pageSegmentsRef.current = pageSegments;

  const isShiftDown = useShiftKey(isEditMode);
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<Point | null>(null);
  const [createCurrent, setCreateCurrent] = useState<Point | null>(null);
  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const [activeGuideX, setActiveGuideX] = useState<number | null>(null);
  const [activeGuideY, setActiveGuideY] = useState<number | null>(null);
  /**
   * 분할 자리 고르기.
   *
   * 예전에는 버튼을 누르는 즉시 박스의 **정중앙**에서 잘랐다. 내용과 무관한 자리라
   * 표를 자르면 행 한가운데를 지나갔다. 이제 선을 끌어 자리를 정하고, 다른 조작과
   * 같은 스냅 앵커(다른 세그먼트 경계 + PDF 텍스트 줄)를 쓴다.
   */
  const [splitRequest, setSplitRequest] = useState<{ segmentId: string; axis: 'horizontal' | 'vertical' } | null>(null);
  const [splitPosition, setSplitPosition] = useState<number | null>(null);

  const snapAnchors = useMemo(
    () => buildSnapAnchors(pageSegments, textLines, resizingState?.segmentId ?? null),
    [pageSegments, textLines, resizingState?.segmentId]
  );

  // 편집 모드를 끄면 진행 중이던 드래그 상태를 모두 비웁니다.
  useEffect(() => {
    if (isEditMode) return;
    setResizingState(null);
    setIsCreating(false);
    setCreateStart(null);
    setCreateCurrent(null);
    setActiveGuideX(null);
    setActiveGuideY(null);
  }, [isEditMode]);

  const cacheContainerRect = useCallback(() => {
    if (containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  const beginSplit = useCallback(
    (segmentId: string, axis: 'horizontal' | 'vertical') => {
      cacheContainerRect();
      setSplitRequest({ segmentId, axis });
      setSplitPosition(null);
    },
    [cacheContainerRect]
  );

  const cancelSplit = useCallback(() => {
    setSplitRequest(null);
    setSplitPosition(null);
  }, []);

  /** 빈 공간 pointerdown: Shift 면 신규 영역 생성 시작, 아니면 선택 해제. */
  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isEditMode) return;
      if (splitRequest) return;
      if (e.target !== containerRef.current) return;

      if (!isShiftDown && !e.shiftKey) {
        setSelectedId(null);
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setSelectedId(null);
      cacheContainerRect();

      const rect = containerRectRef.current;
      if (!rect) return;

      // 드래그 시작점부터 자석이 걸립니다. (Alt 를 누르면 스냅 해제)
      const raw = clientToNormalized(e.clientX, e.clientY, rect);
      const snapped = snapPoint(raw, snapAnchors, enableSnap && !e.altKey);

      setActiveGuideX(snapped.guideX);
      setActiveGuideY(snapped.guideY);
      setIsCreating(true);
      setCreateStart(snapped.point);
      setCreateCurrent(snapped.point);
    },
    [isEditMode, isShiftDown, enableSnap, snapAnchors, setSelectedId, cacheContainerRect, splitRequest]
  );

  /** 박스 본체나 리사이즈 핸들 pointerdown: 이동/리사이즈 시작. */
  const startDrag = useCallback(
    (handle: ResizeHandle, segment: ViewerSegment, e: React.PointerEvent) => {
      if (!isEditMode) return;
      e.stopPropagation();
      e.preventDefault();

      setSelectedId(segment.id);
      onSelectSegment?.(segment);
      cacheContainerRect();

      setResizingState({
        handle,
        segmentId: segment.id,
        initialBox: [...segment.box] as SegmentBox,
        draftBox: [...segment.box] as SegmentBox,
        startClientX: e.clientX,
        startClientY: e.clientY,
      });
    },
    [isEditMode, setSelectedId, onSelectSegment, cacheContainerRect]
  );

  /** 신규 영역을 확정합니다. 너무 작으면 오조작으로 보고 버립니다. */
  const commitCreate = useCallback(() => {
    setIsCreating(false);
    if (createStart && createCurrent) {
      const box = normalizeDragRect(createStart, createCurrent);
      if (isDrawableBox(box)) {
        const newSegment: ViewerSegment = {
          id: `seg-${Date.now()}`,
          page: pageNumber,
          type: segmentTypes[0]?.id ?? 'section',
          label: labels.newSegmentLabel,
          box: box,
          summary: undefined,
        };
        onCreateSegment?.(newSegment);
        setSelectedId(newSegment.id);
      }
    }
    setCreateStart(null);
    setCreateCurrent(null);
  }, [createStart, createCurrent, pageNumber, onCreateSegment, setSelectedId, segmentTypes, labels]);

  /** 이동/리사이즈 결과를 상위에 단 한 번 커밋합니다. */
  const commitResize = useCallback((state: ResizingState) => {
    const target = pageSegmentsRef.current.find((s) => s.id === state.segmentId);
    if (target) {
      onUpdateSegmentRef.current?.({ ...target, box: state.draftBox });
    }
    setResizingState(null);
  }, []);

  // 전역 pointermove / pointerup: 포인터가 컨테이너 밖으로 나가도 이어집니다.
  useEffect(() => {
    if (!isCreating && !resizingState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = containerRectRef.current;
      if (!rect) return;

      const isSnapActive = enableSnap && !e.altKey;

      if (isCreating && createStart) {
        const raw = clientToNormalized(e.clientX, e.clientY, rect);
        const snapped = snapPoint(raw, snapAnchors, isSnapActive);
        setActiveGuideX(snapped.guideX);
        setActiveGuideY(snapped.guideY);
        setCreateCurrent(snapped.point);
        return;
      }

      if (resizingState) {
        const { box, guideX, guideY } = resizeSegmentBox({
          handle: resizingState.handle,
          initialBox: resizingState.initialBox,
          deltaX: ((e.clientX - resizingState.startClientX) / rect.width) * NORMALIZED_MAX,
          deltaY: ((e.clientY - resizingState.startClientY) / rect.height) * NORMALIZED_MAX,
          anchors: snapAnchors,
          isSnapActive,
        });

        setActiveGuideX(guideX);
        setActiveGuideY(guideY);
        setResizingState((prev) => (prev ? { ...prev, draftBox: box } : null));
      }
    };

    const handlePointerUp = () => {
      setActiveGuideX(null);
      setActiveGuideY(null);

      if (isCreating) commitCreate();
      if (resizingState) commitResize(resizingState);

      containerRectRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [
    isCreating,
    createStart,
    resizingState,
    snapAnchors,
    enableSnap,
    commitCreate,
    commitResize,
  ]);

  // 분할 자리 고르기: 포인터를 따라 선이 움직이고, 클릭하면 확정한다.
  useEffect(() => {
    if (!splitRequest) return;
    const target = pageSegmentsRef.current.find((item) => item.id === splitRequest.segmentId);
    if (!target) return;

    const [ymin, xmin, ymax, xmax] = target.box;
    const isHorizontal = splitRequest.axis === 'horizontal';

    const handleMove = (e: PointerEvent) => {
      const rect = containerRectRef.current;
      if (!rect) return;
      const raw = clientToNormalized(e.clientX, e.clientY, rect);
      const snapped = snapPoint(raw, snapAnchors, enableSnap && !e.altKey);
      const value = isHorizontal ? snapped.point.y : snapped.point.x;
      const low = isHorizontal ? ymin : xmin;
      const high = isHorizontal ? ymax : xmax;
      // 박스 밖이나 가장자리에 붙는 자리는 의미 있는 분할이 아니다.
      setSplitPosition(Math.min(Math.max(value, low + 1), high - 1));
    };

    const handleConfirm = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (splitPosition !== null) {
        onSplitSegment?.(splitRequest.segmentId, splitRequest.axis, Math.round(splitPosition));
      }
      cancelSplit();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelSplit();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerdown', handleConfirm, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleConfirm, true);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [splitRequest, splitPosition, snapAnchors, enableSnap, onSplitSegment, cancelSplit]);

  /** 드래그 중인 세그먼트는 초안 박스로, 나머지는 원본 박스로 그립니다. */
  const boxOf = useCallback(
    (segment: ViewerSegment): SegmentBox =>
      resizingState?.segmentId === segment.id ? resizingState.draftBox : segment.box,
    [resizingState]
  );

  const createPreviewBox = useMemo(
    () => (createStart && createCurrent ? normalizeDragRect(createStart, createCurrent) : null),
    [createStart, createCurrent]
  );

  return {
    containerRef,
    isShiftDown,
    isCreating,
    createPreviewBox,
    resizingSegmentId: resizingState?.segmentId ?? null,
    activeGuideX,
    activeGuideY,
    handleContainerPointerDown,
    startDrag,
    boxOf,
    splitRequest,
    splitPosition,
    beginSplit,
    cancelSplit,
  };
}
