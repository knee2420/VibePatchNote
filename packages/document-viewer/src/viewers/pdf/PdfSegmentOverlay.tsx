import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Check, X, Sparkles, Magnet, Edit3 } from 'lucide-react';
import type { ViewerSegment } from '../../types';

interface PdfSegmentOverlayProps {
  pageNumber: number;
  segments?: ViewerSegment[];
  textLines?: number[];
  isEditMode?: boolean;
  enableSnap?: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onSelectSegment?: (segment: ViewerSegment) => void;
}

type ResizeHandle = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'move';

const typeStyles: Record<
  string,
  {
    border: string;
    bg: string;
    hoverBg: string;
    badgeBg: string;
    badgeText: string;
    defaultLabel: string;
  }
> = {
  table: {
    border: 'border-purple-500/90',
    bg: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/25',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    defaultLabel: 'Table',
  },
  list: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/25',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    defaultLabel: 'List',
  },
  section: {
    border: 'border-blue-500/90',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/25',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    defaultLabel: 'Section',
  },
  paragraph: {
    border: 'border-amber-500/90',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/25',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    defaultLabel: 'Block',
  },
};

const TYPE_OPTIONS = [
  { id: 'section', label: 'Section', color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'table', label: 'Table', color: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'list', label: 'List', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'paragraph', label: 'Block', color: 'bg-amber-600 hover:bg-amber-700' },
];

export const PdfSegmentOverlay = memo(function PdfSegmentOverlay({
  pageNumber,
  segments = [],
  textLines = [],
  isEditMode = false,
  enableSnap = true,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onSelectSegment,
}: PdfSegmentOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const activeBoxRef = useRef<HTMLDivElement | null>(null);

  // 최신 prop을 ref로 유지하여 불필요한 useEffect 재등록 차단 (C-4 해결)
  const onUpdateSegmentRef = useRef(onUpdateSegment);
  onUpdateSegmentRef.current = onUpdateSegment;
  const pageSegmentsRef = useRef<ViewerSegment[]>([]);

  // 선택된 세그먼트 ID (리사이징/이동 대상)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 더블클릭 시 라벨/타입 편집 모드 활성화 여부
  const [isEditing, setIsEditing] = useState(false);

  // 호버 중인 세그먼트 ID
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 라벨 인라인 편집 문자열
  const [editingLabel, setEditingLabel] = useState<string>('');

  // Shift 키 누름 상태 (Shift + 드래그 시에만 신규 영역 생성)
  const [isShiftDown, setIsShiftDown] = useState(false);

  // 신규 영역 드래그 생성(Create) 상태
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<{ x: number; y: number } | null>(null);
  const [createCurrent, setCreateCurrent] = useState<{ x: number; y: number } | null>(null);

  // 스마트 마그넷 스냅 가이드선 활성화 좌표
  const [activeGuideX, setActiveGuideX] = useState<number | null>(null);
  const [activeGuideY, setActiveGuideY] = useState<number | null>(null);

  // [C-1] 로컬 드래프트 상태: 드래그 중에는 상위 스토어를 전혀 건드리지 않고 여기서만 60fps로 갱신!
  const [resizingState, setResizingState] = useState<{
    handle: ResizeHandle;
    segmentId: string;
    initialBox: [number, number, number, number];
    draftBox: [number, number, number, number];
    startClientX: number;
    startClientY: number;
  } | null>(null);

  // 현재 페이지에 속한 세그먼트만 필터링
  const pageSegments = useMemo(() => {
    return segments.filter((seg) => seg.page === pageNumber);
  }, [segments, pageNumber]);
  pageSegmentsRef.current = pageSegments;

  // 선택된 세그먼트 객체
  const selectedSegment = useMemo(() => {
    return pageSegments.find((s) => s.id === selectedId) || null;
  }, [pageSegments, selectedId]);

  // 세그먼트 선택 시 라벨 인풋 동기화 (최초 선택 시에만 동기화하여 타이핑 중 리셋 차단 R5)
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedSegment && lastSelectedIdRef.current !== selectedSegment.id) {
      setEditingLabel(selectedSegment.label);
      lastSelectedIdRef.current = selectedSegment.id;
    }
  }, [selectedSegment]);

  // Shift 키 감지 (Shift 누를 때만 마우스 커서 crosshair로 전환 및 신규 생성 대기)
  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
    };
    const handleBlur = () => setIsShiftDown(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isEditMode]);

  // 외부 클릭(Click Outside) 시 선택 및 툴바 즉시 해제
  useEffect(() => {
    if (!selectedId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (activeBoxRef.current && !activeBoxRef.current.contains(e.target as Node)) {
        setSelectedId(null);
        setIsEditing(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [selectedId]);

  // 편집 모드가 꺼지면 모든 선택 상태 초기화
  useEffect(() => {
    if (!isEditMode) {
      setSelectedId(null);
      setIsEditing(false);
      setResizingState(null);
      setIsShiftDown(false);
      setActiveGuideX(null);
      setActiveGuideY(null);
    }
  }, [isEditMode]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setIsEditing(false);
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isEditMode) {
        // [R2 해결] 캔버스 노드 삭제로 전파되지 않도록 정지
        e.preventDefault();
        e.stopPropagation();
        onDeleteSegment?.(selectedId);
        setSelectedId(null);
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setIsEditing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, isEditMode, onDeleteSegment]);

  const clamp = (val: number, min = 0, max = 1000) => Math.max(min, Math.min(max, Math.round(val)));

  // 자석(Smart Magnet) 스냅 대상 가이드 라인 목록 (기존 세그먼트 경계선 + PDF 텍스트 줄 Y좌표)
  const snapAnchors = useMemo(() => {
    const xList: number[] = [];
    const yList: number[] = [];

    // 1. 현재 페이지의 기존 세그먼트 경계선 (특히 표 테두리 xmin, xmax는 가장 중요한 자석!)
    pageSegments.forEach((seg) => {
      if (resizingState && seg.id === resizingState.segmentId) return;
      const [ymin, xmin, ymax, xmax] = seg.box_2d;
      xList.push(xmin, xmax);
      yList.push(ymin, ymax);
    });

    // 2. PDF 텍스트 엔진에서 추출된 텍스트 라인들의 Y 경계
    if (textLines && textLines.length > 0) {
      yList.push(...textLines);
    }

    const xUnique = Array.from(new Set(xList)).sort((a, b) => a - b);
    const yUnique = Array.from(new Set(yList)).sort((a, b) => a - b);

    return { xList: xUnique, yList: yUnique };
  }, [pageSegments, resizingState, textLines]);

  // 스냅 임계값 (0~1000 좌표계에서 20: 약 2% = 15~20px 내 접근 시 착 감김)
  const SNAP_THRESHOLD = 20;

  const getSnapCoord = useCallback(
    (coord: number, targets: number[]) => {
      let minDiff = SNAP_THRESHOLD + 1;
      let snappedVal = coord;
      let targetFound: number | null = null;

      for (const t of targets) {
        const diff = Math.abs(coord - t);
        if (diff <= SNAP_THRESHOLD && diff < minDiff) {
          minDiff = diff;
          snappedVal = t;
          targetFound = t;
        }
      }

      return { val: snappedVal, snapped: targetFound !== null, target: targetFound };
    },
    []
  );

  // 클라이언트 마우스 좌표를 0~1000 정규화 좌표로 변환 (캐시된 rect 우선 활용으로 강제 리플로우 방지 C-5)
  const clientToNormalized = useCallback((clientX: number, clientY: number) => {
    const rect = containerRectRef.current || containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = clamp(((clientX - rect.left) / rect.width) * 1000);
    const y = clamp(((clientY - rect.top) / rect.height) * 1000);
    return { x, y };
  }, []);

  // 1. 신규 세그먼트 드래그 생성 시작 (Shift 누른 상태에서만 발동)
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    if (e.target !== containerRef.current) return;

    // Shift 키를 누르지 않고 빈 공간을 클릭하면 -> 선택 해제만 수행!
    const isShiftActive = isShiftDown || e.shiftKey;
    if (!isShiftActive) {
      setSelectedId(null);
      return;
    }

    // Shift 키가 눌려있을 때만 신규 영역 드래그 생성 활성화!
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    setSelectedId(null);

    if (containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }

    const norm = clientToNormalized(e.clientX, e.clientY);
    let startX = norm.x;
    let startY = norm.y;

    // [요구사항 2] 마우스를 처음 누르는 시작점(Start)에도 즉시 자석 스냅 적용!
    if (enableSnap && !e.altKey) {
      const snapX = getSnapCoord(startX, snapAnchors.xList);
      const snapY = getSnapCoord(startY, snapAnchors.yList);
      startX = snapX.val;
      startY = snapY.val;
      setActiveGuideX(snapX.target);
      setActiveGuideY(snapY.target);
    }

    setIsCreating(true);
    setCreateStart({ x: startX, y: startY });
    setCreateCurrent({ x: startX, y: startY });
  };

  // 2. 리사이즈 / 이동 시작 (드래그 시작 시점 1회만 rect 캐시 C-5)
  const handleHandleMouseDown = (handle: ResizeHandle, seg: ViewerSegment, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(seg.id);
    onSelectSegment?.(seg);

    if (containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }

    setResizingState({
      handle,
      segmentId: seg.id,
      initialBox: [...seg.box_2d],
      draftBox: [...seg.box_2d],
      startClientX: e.clientX,
      startClientY: e.clientY,
    });
  };

  // 전역 마우스 무브 / 업 리스너 (스마트 마그넷 스냅 탑재)
  useEffect(() => {
    if (!isCreating && !resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRectRef.current;
      if (!rect) return;

      const isSnapActive = enableSnap && !e.altKey;

      // 1) 신규 영역 드래그 생성 중 자석 스냅
      if (isCreating && createStart) {
        let x = clamp(((e.clientX - rect.left) / rect.width) * 1000);
        let y = clamp(((e.clientY - rect.top) / rect.height) * 1000);

        if (isSnapActive) {
          const snapX = getSnapCoord(x, snapAnchors.xList);
          const snapY = getSnapCoord(y, snapAnchors.yList);
          x = snapX.val;
          y = snapY.val;
          setActiveGuideX(snapX.target);
          setActiveGuideY(snapY.target);
        } else {
          setActiveGuideX(null);
          setActiveGuideY(null);
        }

        setCreateCurrent({ x, y });
        return;
      }

      // 2) 기존 세그먼트 리사이징 / 이동 중 자석 스냅
      if (resizingState) {
        const deltaX = ((e.clientX - resizingState.startClientX) / rect.width) * 1000;
        const deltaY = ((e.clientY - resizingState.startClientY) / rect.height) * 1000;
        const [initYmin, initXmin, initYmax, initXmax] = resizingState.initialBox;

        let [ymin, xmin, ymax, xmax] = [initYmin, initXmin, initYmax, initXmax];
        const minSize = 20;

        let guideX: number | null = null;
        let guideY: number | null = null;

        if (resizingState.handle === 'move') {
          const w = initXmax - initXmin;
          const h = initYmax - initYmin;
          let nextXmin = clamp(initXmin + deltaX, 0, 1000 - w);
          let nextYmin = clamp(initYmin + deltaY, 0, 1000 - h);

          if (isSnapActive) {
            // 좌측 또는 우측 테두리 자석 스냅
            const snapL = getSnapCoord(nextXmin, snapAnchors.xList);
            const snapR = getSnapCoord(nextXmin + w, snapAnchors.xList);
            if (snapL.snapped) {
              nextXmin = snapL.val;
              guideX = snapL.target;
            } else if (snapR.snapped) {
              nextXmin = snapR.val - w;
              guideX = snapR.target;
            }

            // 상단 또는 하단 테두리 자석 스냅
            const snapT = getSnapCoord(nextYmin, snapAnchors.yList);
            const snapB = getSnapCoord(nextYmin + h, snapAnchors.yList);
            if (snapT.snapped) {
              nextYmin = snapT.val;
              guideY = snapT.target;
            } else if (snapB.snapped) {
              nextYmin = snapB.val - h;
              guideY = snapB.target;
            }
          }

          xmin = nextXmin;
          ymin = nextYmin;
          xmax = xmin + w;
          ymax = ymin + h;
        } else {
          // 4방향 리사이즈 자석 스냅
          if (resizingState.handle.includes('t')) {
            const rawT = clamp(initYmin + deltaY, 0, initYmax - minSize);
            if (isSnapActive) {
              const snapT = getSnapCoord(rawT, snapAnchors.yList);
              ymin = snapT.val;
              if (snapT.snapped) guideY = snapT.target;
            } else {
              ymin = rawT;
            }
          }
          if (resizingState.handle.includes('b')) {
            const rawB = clamp(initYmax + deltaY, initYmin + minSize, 1000);
            if (isSnapActive) {
              const snapB = getSnapCoord(rawB, snapAnchors.yList);
              ymax = snapB.val;
              if (snapB.snapped) guideY = snapB.target;
            } else {
              ymax = rawB;
            }
          }
          if (resizingState.handle.includes('l')) {
            const rawL = clamp(initXmin + deltaX, 0, initXmax - minSize);
            if (isSnapActive) {
              const snapL = getSnapCoord(rawL, snapAnchors.xList);
              xmin = snapL.val;
              if (snapL.snapped) guideX = snapL.target;
            } else {
              xmin = rawL;
            }
          }
          if (resizingState.handle.includes('r')) {
            const rawR = clamp(initXmax + deltaX, initXmin + minSize, 1000);
            if (isSnapActive) {
              const snapR = getSnapCoord(rawR, snapAnchors.xList);
              xmax = snapR.val;
              if (snapR.snapped) guideX = snapR.target;
            } else {
              xmax = rawR;
            }
          }
        }

        setActiveGuideX(guideX);
        setActiveGuideY(guideY);

        // [핵심] 상위 스토어(setNodes)를 절대 부르지 않고 로컬 draftBox만 60fps로 가볍게 갱신!
        setResizingState((prev) => (prev ? { ...prev, draftBox: [ymin, xmin, ymax, xmax] } : null));
      }
    };

    const handleMouseUp = () => {
      // 마우스 업 시 자석 가이드선 해제
      setActiveGuideX(null);
      setActiveGuideY(null);

      // [신규 생성 확정]
      if (isCreating && createStart && createCurrent) {
        setIsCreating(false);
        const ymin = Math.min(createStart.y, createCurrent.y);
        const ymax = Math.max(createStart.y, createCurrent.y);
        const xmin = Math.min(createStart.x, createCurrent.x);
        const xmax = Math.max(createStart.x, createCurrent.x);

        if (ymax - ymin >= 20 && xmax - xmin >= 20) {
          const newId = `seg-${Date.now()}`;
          const newSegment: ViewerSegment = {
            id: newId,
            page: pageNumber,
            type: 'section',
            label: '새 영역 블록',
            box_2d: [ymin, xmin, ymax, xmax],
            content_summary: '사용자 지정 세그먼트',
          };
          onCreateSegment?.(newSegment);
          setSelectedId(newId);
        }
        setCreateStart(null);
        setCreateCurrent(null);
      }

      // [드래그/리사이즈 확정: mouseup 시점에 단 1회만 onUpdateSegment 커밋! C-1]
      if (resizingState) {
        const target = pageSegmentsRef.current.find((s) => s.id === resizingState.segmentId);
        if (target && onUpdateSegmentRef.current) {
          onUpdateSegmentRef.current({
            ...target,
            box_2d: resizingState.draftBox,
          });
        }
        setResizingState(null);
      }
      containerRectRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCreating, createStart, createCurrent, resizingState, pageNumber, onCreateSegment, snapAnchors, getSnapCoord, enableSnap]);

  const handleSaveLabel = () => {
    if (selectedSegment && editingLabel.trim() && onUpdateSegmentRef.current) {
      onUpdateSegmentRef.current({
        ...selectedSegment,
        label: editingLabel.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleChangeType = (newType: string) => {
    if (selectedSegment && onUpdateSegmentRef.current) {
      onUpdateSegmentRef.current({
        ...selectedSegment,
        type: newType,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      className={`
        absolute inset-0 z-10 select-none overflow-visible nodrag nopan
        ${isEditMode ? 'pointer-events-auto' : 'pointer-events-none'}
        ${isEditMode && isShiftDown ? 'cursor-crosshair' : 'cursor-default'}
      `}
    >
      {/* 0. [스마트 마그넷 스냅 가이드라인] (자석 흡착 시 피그마 스타일 가이드선 표시) */}
      {activeGuideX !== null && (
        <div
          style={{ left: `${activeGuideX / 10}%` }}
          className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-purple-600 z-50 pointer-events-none shadow-sm"
        >
          <div className="absolute top-2 -translate-x-1/2 px-1 py-0.2 bg-purple-600 text-white text-[8px] font-bold rounded-xs shadow-md flex items-center gap-0.5">
            <Magnet className="w-2.5 h-2.5" />
            <span>SNAP</span>
          </div>
        </div>
      )}
      {activeGuideY !== null && (
        <div
          style={{ top: `${activeGuideY / 10}%` }}
          className="absolute left-0 right-0 h-0 border-t-2 border-dashed border-purple-600 z-50 pointer-events-none shadow-sm"
        >
          <div className="absolute left-2 -translate-y-1/2 px-1 py-0.2 bg-purple-600 text-white text-[8px] font-bold rounded-xs shadow-md flex items-center gap-0.5">
            <Magnet className="w-2.5 h-2.5" />
            <span>SNAP</span>
          </div>
        </div>
      )}

      {/* 1. 세그먼트 바운딩 박스 목록 */}
      {pageSegments.map((seg) => {
        // [C-1] 드래그 중인 세그먼트는 로컬 draftBox로 60fps 무지연 즉시 렌더링!
        const isCurrentlyResizing = resizingState?.segmentId === seg.id;
        const activeBox = isCurrentlyResizing && resizingState ? resizingState.draftBox : seg.box_2d;

        const [ymin, xmin, ymax, xmax] = activeBox;
        const top = ymin / 10;
        const left = xmin / 10;
        const height = (ymax - ymin) / 10;
        const width = (xmax - xmin) / 10;

        const isSelected = selectedId === seg.id;
        const isHovered = hoveredId === seg.id;
        const styleConfig = typeStyles[seg.type] || typeStyles.paragraph;

        return (
          <div
            key={seg.id}
            ref={isSelected ? activeBoxRef : null}
            // [D-8] 박스 본체 아무 곳이나 잡고 드래그하면 즉시 이동(Move)!
            onMouseDown={(e) => {
              if (!isEditMode) return;
              handleHandleMouseDown('move', seg, e);
            }}
            onClick={(e) => {
              if (!isEditMode) return;
              e.stopPropagation();
              setSelectedId(seg.id);
              setIsEditing(false);
              onSelectSegment?.(seg);
            }}
            onDoubleClick={(e) => {
              if (!isEditMode) return;
              e.stopPropagation();
              setSelectedId(seg.id);
              setEditingLabel(seg.label);
              setIsEditing(true);
            }}
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              height: `${height}%`,
              width: `${width}%`,
            }}
            className={`
              absolute border-2 transition-[border-color,background-color] duration-75 group/seg
              ${isEditMode ? 'pointer-events-auto cursor-move' : 'pointer-events-none cursor-default'}
              ${styleConfig.border}
              ${isSelected && isEditMode ? '!border-purple-600 ring-2 ring-purple-400/80 bg-purple-500/20 z-20 shadow-md' : styleConfig.bg}
              ${isHovered && !isSelected && isEditMode ? styleConfig.hoverBg : ''}
            `}
          >
            {/* 기본 라벨 뱃지 (상단 테두리와 겹치지 않게 -top-5에 플로팅) */}
            <div
              className={`
                absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs
                flex items-center gap-1 transition-transform duration-150 pointer-events-none z-20
                ${styleConfig.badgeBg} ${styleConfig.badgeText}
                ${isHovered && isEditMode ? 'scale-105 shadow-md' : 'opacity-90'}
              `}
            >
              <span className="uppercase text-[9px] opacity-85">{styleConfig.defaultLabel}</span>
              <span className="max-w-[140px] truncate font-medium">{seg.label}</span>
            </div>

            {/* [우측 바깥 플로팅 패널] 호버 미리보기 / 클릭 고정 스캐폴드 / 더블클릭 라벨·타입 편집 */}
            {isEditMode && !isCurrentlyResizing && !isCreating && (isHovered || isSelected) && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
                }}
                className="absolute left-full ml-3 top-0 z-50 min-w-[240px] max-w-[300px] rounded-lg border border-slate-700 p-3 nodrag nopan pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-white"
              >
                {/* 상단 헤더: 타입 뱃지 + (선택 상태 시: 편집, 삭제, 닫기 액션 버튼) */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${styleConfig.badgeBg} ${styleConfig.badgeText}`}>
                      {seg.type}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[130px]">
                      {seg.label}
                    </span>
                  </div>

                  {/* 선택 상태 시 액션 버튼 */}
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingLabel(seg.label);
                            setIsEditing(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="라벨/타입 편집 (더블클릭)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDeleteSegment?.(seg.id);
                          setSelectedId(null);
                          setIsEditing(false);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="세그먼트 삭제 (Del)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedId(null);
                          setIsEditing(false);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="선택 해제 (Esc)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 본문 영역: 상태별 분기 */}
                {isSelected && isEditing ? (
                  /* 3단계: [더블클릭] 라벨 및 타입 편집 모드 */
                  <div className="space-y-2.5">
                    {/* 라벨 텍스트 수정 인풋 */}
                    <div className="flex items-center gap-1 bg-slate-800/90 rounded px-2 py-1.5 border border-purple-500/50 focus-within:border-purple-400">
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveLabel();
                          } else if (e.key === 'Escape') {
                            setIsEditing(false);
                          }
                        }}
                        placeholder="라벨 입력..."
                        className="w-full bg-transparent text-xs text-white outline-none font-medium placeholder:text-slate-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveLabel}
                        className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded cursor-pointer"
                        title="저장 (Enter)"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 타입 변경 스위처 */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleChangeType(opt.id)}
                          className={`
                            px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer
                            ${seg.type === opt.id ? `${opt.color} text-white shadow-xs ring-1 ring-white/40 scale-105` : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                          `}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* 요약 내용 (존재 시) */}
                    {seg.content_summary && (
                      <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-800/50 p-2 rounded border border-slate-700/50 line-clamp-3">
                        {seg.content_summary}
                      </p>
                    )}
                  </div>
                ) : (
                  /* 1 & 2단계: [호버 및 단일 클릭] 스캐폴드 정보 뷰 모드 */
                  <div className="space-y-1.5">
                    {/* 라벨 명칭 */}
                    <p className="text-xs font-bold text-purple-300">
                      {seg.label}
                    </p>

                    {/* 스캐폴드 요약 본문 */}
                    {seg.content_summary ? (
                      <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-800/40 p-2 rounded border border-slate-700/40 line-clamp-4">
                        {seg.content_summary}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">내용 요약 없음</p>
                    )}

                    {/* 상태별 가이드 힌트 */}
                    <p className="text-[9px] text-slate-400 pt-0.5">
                      {isSelected ? (
                        <span className="text-purple-400 font-medium">💡 더블 클릭하여 라벨 및 타입 편집</span>
                      ) : (
                        <span>클릭하여 정보 고정 · 더블클릭하여 편집</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4면 전체(상/하/좌/우) 풀-에지 리사이즈 & 4모서리 핸들러 */}
            {isSelected && isEditMode && (
              <>
                {/* 1) 4개 모서리 (Corner: z-40 최상위로 액션바나 뱃지에 절대 가려지지 않음) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('tl', seg, e)}
                  className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 nodrag nopan group/handle"
                  title="크기 조절 (좌상단)"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('tr', seg, e)}
                  className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 nodrag nopan group/handle"
                  title="크기 조절 (우상단)"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('br', seg, e)}
                  className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 nodrag nopan group/handle"
                  title="크기 조절 (우하단)"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('bl', seg, e)}
                  className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 nodrag nopan group/handle"
                  title="크기 조절 (좌하단)"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>

                {/* 2) 상단 변 (Top Edge: 테두리 선 전체 ↕ + 가로 정중앙 알약 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('t', seg, e)}
                  style={{ top: '-4px', left: '0px', right: '0px', height: '8px' }}
                  className="absolute cursor-ns-resize z-30 nodrag nopan group/top-edge"
                  title="상단 높이 조절"
                >
                  <div className="w-full h-full bg-transparent group-hover/top-edge:bg-purple-500/50 transition-colors" />
                  <div
                    style={{ left: '50%', transform: 'translateX(-50%)', top: '1px' }}
                    className="absolute w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/top-edge:scale-115 transition-transform"
                  />
                </div>

                {/* 3) 하단 변 (Bottom Edge: 테두리 선 전체 ↕ + 가로 정중앙 알약 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('b', seg, e)}
                  style={{ bottom: '-4px', left: '0px', right: '0px', height: '8px' }}
                  className="absolute cursor-ns-resize z-30 nodrag nopan group/bottom-edge"
                  title="하단 높이 조절"
                >
                  <div className="w-full h-full bg-transparent group-hover/bottom-edge:bg-purple-500/50 transition-colors" />
                  <div
                    style={{ left: '50%', transform: 'translateX(-50%)', bottom: '1px' }}
                    className="absolute w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/bottom-edge:scale-115 transition-transform"
                  />
                </div>

                {/* 4) 좌측 변 (Left Edge: 테두리 선 전체 ↔ + 세로 정중앙 알약 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('l', seg, e)}
                  style={{ left: '-4px', top: '0px', bottom: '0px', width: '8px' }}
                  className="absolute cursor-ew-resize z-30 nodrag nopan group/left-edge"
                  title="좌측 너비 조절"
                >
                  <div className="w-full h-full bg-transparent group-hover/left-edge:bg-purple-500/50 transition-colors" />
                  <div
                    style={{ top: '50%', transform: 'translateY(-50%)', left: '1px' }}
                    className="absolute w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/left-edge:scale-115 transition-transform"
                  />
                </div>

                {/* 5) 우측 변 (Right Edge: 테두리 선 전체 ↔ + 세로 정중앙 알약 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('r', seg, e)}
                  style={{ right: '-4px', top: '0px', bottom: '0px', width: '8px' }}
                  className="absolute cursor-ew-resize z-30 nodrag nopan group/right-edge"
                  title="우측 너비 조절"
                >
                  <div className="w-full h-full bg-transparent group-hover/right-edge:bg-purple-500/50 transition-colors" />
                  <div
                    style={{ top: '50%', transform: 'translateY(-50%)', right: '1px' }}
                    className="absolute w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/right-edge:scale-115 transition-transform"
                  />
                </div>
              </>
            )}

          </div>
        );
      })}

      {/* 4. [Create] 신규 드래그 마스킹 중일 때 가이드 박스 표시 */}
      {isEditMode && isCreating && createStart && createCurrent && (
        <div
          style={{
            top: `${Math.min(createStart.y, createCurrent.y) / 10}%`,
            left: `${Math.min(createStart.x, createCurrent.x) / 10}%`,
            height: `${Math.abs(createCurrent.y - createStart.y) / 10}%`,
            width: `${Math.abs(createCurrent.x - createStart.x) / 10}%`,
          }}
          className="absolute border-2 border-dashed border-purple-500 bg-purple-500/20 rounded-xs pointer-events-none z-30"
        >
          <div className="absolute -top-5 left-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-bold shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>새 영역 생성 중</span>
          </div>
        </div>
      )}
    </div>
  );
});
