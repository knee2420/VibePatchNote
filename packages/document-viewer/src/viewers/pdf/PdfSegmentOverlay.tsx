import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Check, X, Sparkles, Edit3 } from 'lucide-react';
import type { ViewerSegment } from '../../types';

interface PdfSegmentOverlayProps {
  pageNumber: number;
  segments?: ViewerSegment[];
  isEditMode?: boolean;
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
  isEditMode = false,
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
  // 라벨/타입 편집 툴바 열림 여부 (더블클릭 또는 편집 버튼 클릭 시에만 true!)
  const [isEditingToolbarOpen, setIsEditingToolbarOpen] = useState(false);

  // 호버 중인 세그먼트 ID
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 라벨 인라인 편집 문자열
  const [editingLabel, setEditingLabel] = useState<string>('');

  // Shift 키 누름 상태
  const [isShiftDown, setIsShiftDown] = useState(false);

  // 신규 영역 드래그 생성(Create) 상태
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<{ x: number; y: number } | null>(null);
  const [createCurrent, setCreateCurrent] = useState<{ x: number; y: number } | null>(null);

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

  // Shift 키 감지 (편집 모드일 때만 드래그 생성 지원)
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
        setIsEditingToolbarOpen(false);
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
      setIsEditingToolbarOpen(false);
      setResizingState(null);
    }
  }, [isEditMode]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setIsEditingToolbarOpen(false);
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isEditMode) {
        // [R2 해결] 캔버스 노드 삭제로 전파되지 않도록 정지
        e.preventDefault();
        e.stopPropagation();
        onDeleteSegment?.(selectedId);
        setSelectedId(null);
        setIsEditingToolbarOpen(false);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setIsEditingToolbarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, isEditMode, onDeleteSegment]);

  const clamp = (val: number, min = 0, max = 1000) => Math.max(min, Math.min(max, Math.round(val)));

  // 클라이언트 마우스 좌표를 0~1000 정규화 좌표로 변환 (캐시된 rect 우선 활용으로 강제 리플로우 방지 C-5)
  const clientToNormalized = useCallback((clientX: number, clientY: number) => {
    const rect = containerRectRef.current || containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = clamp(((clientX - rect.left) / rect.width) * 1000);
    const y = clamp(((clientY - rect.top) / rect.height) * 1000);
    return { x, y };
  }, []);

  // 1. 신규 세그먼트 드래그 생성 시작
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || (!isShiftDown && !e.shiftKey)) {
      return;
    }
    e.stopPropagation();
    setSelectedId(null);
    setIsEditingToolbarOpen(false);

    if (containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }

    const norm = clientToNormalized(e.clientX, e.clientY);
    setIsCreating(true);
    setCreateStart(norm);
    setCreateCurrent(norm);
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

  // 전역 마우스 무브 / 업 리스너 (C-1, C-4, C-5 해결: 오직 로컬 드래프트만 갱신!)
  useEffect(() => {
    if (!isCreating && !resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRectRef.current;
      if (!rect) return;

      if (isCreating && createStart) {
        const x = clamp(((e.clientX - rect.left) / rect.width) * 1000);
        const y = clamp(((e.clientY - rect.top) / rect.height) * 1000);
        setCreateCurrent({ x, y });
        return;
      }

      if (resizingState) {
        const deltaX = ((e.clientX - resizingState.startClientX) / rect.width) * 1000;
        const deltaY = ((e.clientY - resizingState.startClientY) / rect.height) * 1000;
        const [initYmin, initXmin, initYmax, initXmax] = resizingState.initialBox;

        let [ymin, xmin, ymax, xmax] = [initYmin, initXmin, initYmax, initXmax];
        const minSize = 25;

        if (resizingState.handle === 'move') {
          const w = initXmax - initXmin;
          const h = initYmax - initYmin;
          xmin = clamp(initXmin + deltaX, 0, 1000 - w);
          ymin = clamp(initYmin + deltaY, 0, 1000 - h);
          xmax = xmin + w;
          ymax = ymin + h;
        } else {
          if (resizingState.handle.includes('t')) ymin = clamp(initYmin + deltaY, 0, initYmax - minSize);
          if (resizingState.handle.includes('b')) ymax = clamp(initYmax + deltaY, initYmin + minSize, 1000);
          if (resizingState.handle.includes('l')) xmin = clamp(initXmin + deltaX, 0, initXmax - minSize);
          if (resizingState.handle.includes('r')) xmax = clamp(initXmax + deltaX, initXmin + minSize, 1000);
        }

        // [핵심] 상위 스토어(setNodes)를 절대 부르지 않고 로컬 draftBox만 60fps로 가볍게 갱신!
        setResizingState((prev) => (prev ? { ...prev, draftBox: [ymin, xmin, ymax, xmax] } : null));
      }
    };

    const handleMouseUp = () => {
      // [신규 생성 확정]
      if (isCreating && createStart && createCurrent) {
        setIsCreating(false);
        const ymin = Math.min(createStart.y, createCurrent.y);
        const ymax = Math.max(createStart.y, createCurrent.y);
        const xmin = Math.min(createStart.x, createCurrent.x);
        const xmax = Math.max(createStart.x, createCurrent.x);

        if (ymax - ymin >= 25 && xmax - xmin >= 25) {
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
          setIsEditingToolbarOpen(true);
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
  }, [isCreating, createStart, createCurrent, resizingState, pageNumber, onCreateSegment]);

  const handleSaveLabel = () => {
    if (selectedSegment && editingLabel.trim() && onUpdateSegmentRef.current) {
      onUpdateSegmentRef.current({
        ...selectedSegment,
        label: editingLabel.trim(),
      });
    }
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
        absolute inset-0 z-10 select-none overflow-visible
        ${isEditMode && isShiftDown ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none cursor-default'}
      `}
    >
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
              onSelectSegment?.(seg);
            }}
            onDoubleClick={(e) => {
              if (!isEditMode) return;
              e.stopPropagation();
              setSelectedId(seg.id);
              setIsEditingToolbarOpen(true);
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
            {/* [D-7 해결] 상단 잘림 방지: 박스 안쪽 상단 우측에 깔끔하게 인라인 임베드된 액션 버튼 바 */}
            {isSelected && isEditMode && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-1 right-1 h-5 bg-slate-900/90 backdrop-blur-xs text-white rounded flex items-center gap-1 px-1.5 z-30 shadow-md nodrag nopan pointer-events-auto"
              >
                <button
                  onClick={() => setIsEditingToolbarOpen((prev) => !prev)}
                  className={`p-0.5 rounded hover:text-purple-300 ${isEditingToolbarOpen ? 'text-purple-400' : 'text-slate-300'}`}
                  title="라벨/타입 수정 (더블클릭)"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    onDeleteSegment?.(seg.id);
                    setSelectedId(null);
                    setIsEditingToolbarOpen(false);
                  }}
                  className="p-0.5 rounded text-slate-300 hover:text-rose-400 transition-colors"
                  title="세그먼트 삭제 (Del)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setIsEditingToolbarOpen(false);
                  }}
                  className="p-0.5 rounded text-slate-300 hover:text-white transition-colors"
                  title="선택 해제 (Esc)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 기본 라벨 뱃지 (선택되지 않았거나, 툴바가 닫혀있을 때 표시) */}
            {(!isSelected || !isEditingToolbarOpen) && (
              <div
                onDoubleClick={(e) => {
                  if (!isEditMode) return;
                  e.stopPropagation();
                  setSelectedId(seg.id);
                  setIsEditingToolbarOpen(true);
                }}
                className={`
                  absolute -top-3 left-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs
                  flex items-center gap-1 transition-transform duration-150 pointer-events-none
                  ${styleConfig.badgeBg} ${styleConfig.badgeText}
                  ${isHovered && isEditMode ? 'scale-105 shadow-md' : 'opacity-90'}
                `}
              >
                <span className="uppercase text-[9px] opacity-85">{styleConfig.defaultLabel}</span>
                <span className="max-w-[140px] truncate font-medium">{seg.label}</span>
              </div>
            )}

            {/* 호버 요약 툴팁 (편집 모드 & 선택되지 않고 호버 중일 때만) */}
            {seg.content_summary && isHovered && !isSelected && isEditMode && !isCurrentlyResizing && (
              <div className="absolute left-1 top-full mt-1 z-30 bg-slate-900/95 backdrop-blur-xs text-white text-[11px] leading-snug p-2.5 rounded-md shadow-xl max-w-[250px] pointer-events-none border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150">
                <p className="font-semibold text-purple-300 mb-0.5">{seg.label}</p>
                <p className="text-slate-200 text-[10px] line-clamp-3">{seg.content_summary}</p>
              </div>
            )}

            {/* [D-9 해결] 8방향 리사이즈 핸들러 (24px 투명 히트박스로 빗나가지 않는 쾌적한 조작감!) */}
            {isSelected && isEditMode && (
              <>
                {/* 모서리 4개 (w-6 h-6 투명 히트박스 안에 화이트 도트 렌더링) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('tl', seg, e)}
                  className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30 nodrag nopan group/handle"
                  title="크기 조절"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('tr', seg, e)}
                  className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30 nodrag nopan group/handle"
                  title="크기 조절"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('br', seg, e)}
                  className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30 nodrag nopan group/handle"
                  title="크기 조절"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>
                <div
                  onMouseDown={(e) => handleHandleMouseDown('bl', seg, e)}
                  className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30 nodrag nopan group/handle"
                  title="크기 조절"
                >
                  <div className="w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                </div>

                {/* 4면 전체(상/하/좌/우) 풀-에지 리사이즈 & 선명한 알약(Pill) 핸들 */}
                {/* 1) 상단 변 (Top Edge 전체 + 중앙 Pill 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('t', seg, e)}
                  className="absolute -top-2 left-3 right-3 h-4 flex items-center justify-center cursor-ns-resize z-25 nodrag nopan group/top-edge"
                  title="상단 높이 조절 (선 전체 드래그 가능)"
                >
                  <div className="w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/top-edge:scale-115 group-hover/top-edge:bg-purple-50 transition-transform" />
                </div>

                {/* 2) 하단 변 (Bottom Edge 전체 + 중앙 Pill 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('b', seg, e)}
                  className="absolute -bottom-2 left-3 right-3 h-4 flex items-center justify-center cursor-ns-resize z-25 nodrag nopan group/bottom-edge"
                  title="하단 높이 조절 (선 전체 드래그 가능)"
                >
                  <div className="w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/bottom-edge:scale-115 group-hover/bottom-edge:bg-purple-50 transition-transform" />
                </div>

                {/* 3) 좌측 변 (Left Edge 전체 + 중앙 Pill 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('l', seg, e)}
                  className="absolute top-3 bottom-3 -left-2 w-4 flex items-center justify-center cursor-ew-resize z-25 nodrag nopan group/left-edge"
                  title="좌측 너비 조절 (선 전체 드래그 가능)"
                >
                  <div className="w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/left-edge:scale-115 group-hover/left-edge:bg-purple-50 transition-transform" />
                </div>

                {/* 4) 우측 변 (Right Edge 전체 + 중앙 Pill 핸들) */}
                <div
                  onMouseDown={(e) => handleHandleMouseDown('r', seg, e)}
                  className="absolute top-3 bottom-3 -right-2 w-4 flex items-center justify-center cursor-ew-resize z-25 nodrag nopan group/right-edge"
                  title="우측 너비 조절 (선 전체 드래그 가능)"
                >
                  <div className="w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/right-edge:scale-115 group-hover/right-edge:bg-purple-50 transition-transform" />
                </div>
              </>
            )}

            {/* 3. [Labeling & Type Editing] 슬림 플로팅 미니 툴바 (더블클릭 또는 편집 아이콘 클릭 시에만 노출!) */}
            {isSelected && isEditMode && isEditingToolbarOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-2xl border border-slate-700/80 flex items-center gap-2 nodrag nopan animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
              >
                {/* 라벨 텍스트 수정 인풋 */}
                <div className="flex items-center gap-1 bg-slate-800/90 rounded px-2 py-1 border border-slate-700">
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveLabel();
                        setIsEditingToolbarOpen(false);
                      } else if (e.key === 'Escape') {
                        setIsEditingToolbarOpen(false);
                      }
                    }}
                    onBlur={handleSaveLabel}
                    placeholder="라벨 입력..."
                    className="w-32 bg-transparent text-xs text-white outline-none font-medium"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      handleSaveLabel();
                      setIsEditingToolbarOpen(false);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded"
                    title="저장 (Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 타입(Type) 변경 스위처 */}
                <div className="flex items-center gap-1">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleChangeType(opt.id)}
                      className={`
                        px-1.5 py-0.5 rounded text-[10px] font-bold transition-all
                        ${seg.type === opt.id ? `${opt.color} text-white shadow-xs ring-1 ring-white/40 scale-105` : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={() => setIsEditingToolbarOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title="닫기 (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
