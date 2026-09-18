import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MousePointer,
  Type,
  Trash2,
  Zap,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { SlotBindingInfo } from '../model/types';

export type CanvasToolMode = 'select' | 'text';

export interface SelectedElementMeta {
  id: string; // slotId 또는 생성된 고유 키
  type: 'slot' | 'cell' | 'row' | 'table' | 'heading' | 'paragraph';
  slotId?: string;
  slotNumber?: number;
  label: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  htmlTag: string;
}

export interface VisualElementOverlayProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  pageNumber: number;
  activeSlotId?: string | null;
  onSlotClick?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;
  onAcceptSlotSuggestion?: (slotId: string) => void;
  slotBindings?: Record<string, SlotBindingInfo>;
  toolMode: CanvasToolMode;
  onChangeToolMode: (mode: CanvasToolMode) => void;
  scale: number;
  onSelectSlotsChange?: (slotIds: string[]) => void;
}

/**
 * VisualElementOverlay (Puck / Figma / Canva 스타일 비주얼 개별/다중 요소 인스펙터)
 *
 * 1. 단일 요소 클릭 선택 (Figma Selection Frame & Bounding Box)
 * 2. Shift + 클릭 다중 요소 누적 선택
 * 3. 캔버스 마우스 드래그 마퀴(Rubberband Marquee) 박스 다중 선택 (어디서든 자유 드래그)
 * 4. 다중 요소 일괄 작업 플로팅 툴바 (일괄 추천값 주입, 일괄 비우기)
 */
export function VisualElementOverlay({
  cardRef,
  pageNumber,
  activeSlotId,
  onSlotClick,
  onBindSlot,
  onAcceptSlotSuggestion,
  slotBindings = {},
  toolMode,
  onChangeToolMode,
  scale,
  onSelectSlotsChange,
}: VisualElementOverlayProps) {
  // 1. 마우스 호버 가이드 상태
  const [hoveredRect, setHoveredRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
    type?: string;
  } | null>(null);

  // 2. 선택된 요소 목록 (다중 선택 지원 배열)
  const [selectedMetas, setSelectedMetas] = useState<SelectedElementMeta[]>([]);
  const selectedDomMap = useRef<Map<string, HTMLElement>>(new Map());

  // 3. 마우스 드래그 마퀴(Marquee Selection) 상태
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // 마퀴 드래그 직후의 잔여 클릭 방지 플래그
  const justFinishedMarqueeRef = useRef(false);

  // 컨테이너 내부 요소의 상대 좌표 계산 (CSS Scale 변환 보정)
  const computeRelativeRect = useCallback(
    (targetEl: HTMLElement) => {
      const container = cardRef.current;
      if (!container) return null;

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const currentScale = scale > 0 ? scale : 1;

      const top = (targetRect.top - containerRect.top) / currentScale;
      const left = (targetRect.left - containerRect.left) / currentScale;
      const width = targetRect.width / currentScale;
      const height = targetRect.height / currentScale;

      return { top, left, width, height };
    },
    [cardRef, scale]
  );

  // activeSlotId 변경 시 단일 슬롯 자동 선택 & 흡착
  useEffect(() => {
    const container = cardRef.current;
    if (!container) return;

    if (!activeSlotId) {
      // 슬롯이 선택 해제되었을 때
      setSelectedMetas((prev) => prev.filter((m) => m.type !== 'slot'));
      return;
    }

    const slotEl = container.querySelector<HTMLElement>(`span[data-type="scaffold-slot"][data-slot-id="${activeSlotId}"]`);
    if (slotEl) {
      const rect = computeRelativeRect(slotEl);
      if (rect) {
        const numStr = slotEl.getAttribute('data-mapping-num');
        const num = numStr ? parseInt(numStr, 10) : undefined;
        selectedDomMap.current.set(activeSlotId, slotEl);
        setSelectedMetas([
          {
            id: activeSlotId,
            type: 'slot',
            slotId: activeSlotId,
            slotNumber: num,
            label: slotBindings[activeSlotId]?.label || `슬롯 #${activeSlotId}`,
            rect,
            htmlTag: 'SPAN',
          },
        ]);
      }
    }
  }, [activeSlotId, cardRef, computeRelativeRect, slotBindings]);

  // 선택된 슬롯 ID 목록을 상위 AI 패널 및 컨텍스트 풀로 실시간 동기화 (셀에 연관된 슬롯 포함)
  useEffect(() => {
    const slotIds = Array.from(
      new Set(
        selectedMetas
          .map((m) => m.slotId)
          .filter((id): id is string => Boolean(id))
      )
    );
    onSelectSlotsChange?.(slotIds);
  }, [selectedMetas, onSelectSlotsChange]);

  // 마우스 이동 시 호버 요소 감지 (Select 모드일 때만)
  useEffect(() => {
    const container = cardRef.current;
    if (!container || toolMode !== 'select' || isMarqueeActive) {
      setHoveredRect(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !container.contains(target)) {
        setHoveredRect(null);
        return;
      }

      // 슬롯 박스 우선 감지
      const slotEl = target.closest<HTMLElement>('span[data-type="scaffold-slot"]');
      if (slotEl) {
        const sId = slotEl.getAttribute('data-slot-id') || '';
        if (selectedMetas.some((m) => m.id === sId)) {
          setHoveredRect(null);
          return;
        }
        const rect = computeRelativeRect(slotEl);
        if (rect) {
          const num = slotEl.getAttribute('data-mapping-num') || '';
          setHoveredRect({
            ...rect,
            label: slotBindings[sId]?.label || `슬롯 #${num || sId}`,
            type: 'Slot',
          });
          return;
        }
      }

      // 테이블 셀 감지
      const cellEl = target.closest<HTMLElement>('td, th');
      if (cellEl) {
        const rect = computeRelativeRect(cellEl);
        if (rect) {
          const cellText = (cellEl.textContent || '').trim().slice(0, 12);
          setHoveredRect({
            ...rect,
            label: cellText ? `셀: ${cellText}` : 'Table Cell',
            type: 'Cell',
          });
          return;
        }
      }

      // 제목/단락 블록 감지
      const blockEl = target.closest<HTMLElement>('h1, h2, h3, p');
      if (blockEl && blockEl !== container) {
        const rect = computeRelativeRect(blockEl);
        if (rect) {
          const tag = blockEl.tagName.toLowerCase();
          const preview = (blockEl.textContent || '').trim().slice(0, 14);
          setHoveredRect({
            ...rect,
            label: `${tag.toUpperCase()}: ${preview || '단락'}`,
            type: tag,
          });
          return;
        }
      }

      setHoveredRect(null);
    };

    const handleMouseLeave = () => {
      setHoveredRect(null);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cardRef, toolMode, computeRelativeRect, slotBindings, selectedMetas, isMarqueeActive]);

  // [핵심 인터랙션 A: 마우스 드래그 마퀴(Rubberband Marquee) 영역 다중 선택 — 캔버스 어디서든 드래그 가능]
  useEffect(() => {
    const container = cardRef.current;
    if (!container || toolMode !== 'select') return;

    let startX = 0;
    let startY = 0;
    let isMouseDown = false;
    let hasDragged = false;
    let currentRect: { top: number; left: number; width: number; height: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      // 마우스 좌클릭만 처리
      if (e.button !== 0) return;

      // 툴바나 오버레이 대화형 요소 클릭은 드래그 시작 안 함
      if ((e.target as HTMLElement)?.closest('[data-overlay-interactive]')) return;
      const target = e.target as HTMLElement | null;
      if (!target || !container.contains(target)) return;

      const containerRect = container.getBoundingClientRect();
      const effectiveScale = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;

      startX = (e.clientX - containerRect.left) / effectiveScale;
      startY = (e.clientY - containerRect.top) / effectiveScale;
      isMouseDown = true;
      hasDragged = false;
      currentRect = null;

      // 선택 모드에서는 텍스트 선택 I-beam 드래그 방지
      if (toolMode === 'select') {
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const containerRect = container.getBoundingClientRect();
      const effectiveScale = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;

      const currentX = (e.clientX - containerRect.left) / effectiveScale;
      const currentY = (e.clientY - containerRect.top) / effectiveScale;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      // 4px 이상 이동 시 마퀴 드래그 발동
      if (width > 4 || height > 4) {
        hasDragged = true;
        setIsMarqueeActive(true);
        currentRect = { top, left, width, height };
        setMarqueeRect(currentRect);

        // 드래그 중인 영역과 겹치는 요소들 실시간 계산 (피그마식 라이브 프리뷰)
        const slots = container.querySelectorAll<HTMLElement>('span[data-type="scaffold-slot"]');
        const cells = container.querySelectorAll<HTMLElement>('td, th');
        const liveMetas: SelectedElementMeta[] = [];

        // 1. 슬롯 충돌 검사
        slots.forEach((slotEl) => {
          const rect = computeRelativeRect(slotEl);
          if (!rect) return;

          const intersects =
            left < rect.left + rect.width &&
            left + width > rect.left &&
            top < rect.top + rect.height &&
            top + height > rect.top;

          if (intersects) {
            const sId = slotEl.getAttribute('data-slot-id') || '';
            const numStr = slotEl.getAttribute('data-mapping-num');
            const num = numStr ? parseInt(numStr, 10) : undefined;
            liveMetas.push({
              id: sId,
              type: 'slot',
              slotId: sId,
              slotNumber: num,
              label: slotBindings[sId]?.label || `슬롯 #${sId}`,
              rect,
              htmlTag: 'SPAN',
            });
            selectedDomMap.current.set(sId, slotEl);
          }
        });

        // 2. 테이블 셀 충돌 검사 (선택된 슬롯이 없는 셀도 포함)
        cells.forEach((cellEl) => {
          const rect = computeRelativeRect(cellEl);
          if (!rect) return;

          const intersects =
            left < rect.left + rect.width &&
            left + width > rect.left &&
            top < rect.top + rect.height &&
            top + height > rect.top;

          if (intersects) {
            // 셀 내부에 슬롯이 이미 있으면 슬롯 단위가 더 세밀하므로 중복 방지
            const childSlot = cellEl.querySelector('span[data-type="scaffold-slot"]');
            if (!childSlot) {
              const cellId = `cell-${Math.round(rect.top)}-${Math.round(rect.left)}`;
              const text = (cellEl.textContent || '').trim().slice(0, 14);

              // 해당 셀이 속한 행(TR)의 연관 슬롯 탐색 (예: "회의내용" 라벨 ➔ Slot #s5 매핑)
              const tr = cellEl.closest('tr');
              const rowSlot = tr?.querySelector('span[data-type="scaffold-slot"]');
              const associatedSlotId = rowSlot?.getAttribute('data-slot-id') || undefined;
              const numStr = rowSlot?.getAttribute('data-mapping-num');
              const associatedSlotNum = numStr ? parseInt(numStr, 10) : undefined;

              liveMetas.push({
                id: cellId,
                type: 'cell',
                slotId: associatedSlotId,
                slotNumber: associatedSlotNum,
                label: text ? (associatedSlotId ? `${text} (#${associatedSlotId})` : `셀: ${text}`) : 'Table Cell',
                rect,
                htmlTag: cellEl.tagName,
              });
              selectedDomMap.current.set(cellId, cellEl);
            }
          }
        });

        if (liveMetas.length > 0) {
          setSelectedMetas(liveMetas);
        }
      }
    };

    const handleMouseUp = () => {
      if (isMouseDown && hasDragged && currentRect) {
        // 드래그가 끝났을 때 잔여 클릭 방지
        justFinishedMarqueeRef.current = true;
        setTimeout(() => {
          justFinishedMarqueeRef.current = false;
        }, 120);
      }

      isMouseDown = false;
      hasDragged = false;
      setIsMarqueeActive(false);
      setMarqueeRect(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cardRef, toolMode, computeRelativeRect, slotBindings]);

  // [핵심 인터랙션 B: 마우스 단일 클릭 및 Shift+클릭 다중 선택]
  useEffect(() => {
    const container = cardRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      // 마퀴 드래그가 방금 끝났으면 단일 클릭 이벤트 무시
      if (justFinishedMarqueeRef.current) {
        return;
      }

      // 툴바나 오버레이 대화형 요소 클릭 무시
      if ((e.target as HTMLElement)?.closest('[data-overlay-interactive]')) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target || !container.contains(target)) return;

      const isShift = e.shiftKey;

      // 1. 슬롯 클릭
      const slotEl = target.closest<HTMLElement>('span[data-type="scaffold-slot"]');
      if (slotEl) {
        const sId = slotEl.getAttribute('data-slot-id') || '';
        const numStr = slotEl.getAttribute('data-mapping-num');
        const num = numStr ? parseInt(numStr, 10) : undefined;
        const rect = computeRelativeRect(slotEl);

        if (rect) {
          const meta: SelectedElementMeta = {
            id: sId,
            type: 'slot',
            slotId: sId,
            slotNumber: num,
            label: slotBindings[sId]?.label || `슬롯 #${sId}`,
            rect,
            htmlTag: 'SPAN',
          };

          if (isShift) {
            // Shift 클릭: 토글 (있으면 제거, 없으면 추가)
            setSelectedMetas((prev) => {
              const exists = prev.some((m) => m.id === sId);
              if (exists) {
                selectedDomMap.current.delete(sId);
                return prev.filter((m) => m.id !== sId);
              } else {
                selectedDomMap.current.set(sId, slotEl);
                return [...prev, meta];
              }
            });
          } else {
            // 단일 클릭: 기존 선택 교체
            selectedDomMap.current.clear();
            selectedDomMap.current.set(sId, slotEl);
            setSelectedMetas([meta]);
          }

          onSlotClick?.(sId, pageNumber, num);
          return;
        }
      }

      // 2. Select 모드일 때 셀/단락 클릭
      if (toolMode === 'select') {
        const cellEl = target.closest<HTMLElement>('td, th');
        if (cellEl) {
          const rect = computeRelativeRect(cellEl);
          if (rect) {
            const cellId = `cell-${Math.round(rect.top)}-${Math.round(rect.left)}`;
            const text = (cellEl.textContent || '').trim().slice(0, 16);

            // 해당 셀 내부 또는 행(TR)의 연관 슬롯 탐색 (예: "회의내용" 라벨 ➔ s5 슬롯 매핑)
            const tr = cellEl.closest('tr');
            const rowSlot = cellEl.querySelector('span[data-type="scaffold-slot"]') || tr?.querySelector('span[data-type="scaffold-slot"]');
            const associatedSlotId = rowSlot?.getAttribute('data-slot-id') || undefined;
            const numStr = rowSlot?.getAttribute('data-mapping-num');
            const associatedSlotNum = numStr ? parseInt(numStr, 10) : undefined;

            const meta: SelectedElementMeta = {
              id: cellId,
              type: 'cell',
              slotId: associatedSlotId,
              slotNumber: associatedSlotNum,
              label: text ? (associatedSlotId ? `${text} (Slot #${associatedSlotId})` : `셀: ${text}`) : 'Table Cell',
              rect,
              htmlTag: cellEl.tagName,
            };

            if (isShift) {
              setSelectedMetas((prev) => {
                const exists = prev.some((m) => m.id === cellId);
                if (exists) {
                  selectedDomMap.current.delete(cellId);
                  return prev.filter((m) => m.id !== cellId);
                } else {
                  selectedDomMap.current.set(cellId, cellEl);
                  return [...prev, meta];
                }
              });
            } else {
              selectedDomMap.current.clear();
              selectedDomMap.current.set(cellId, cellEl);
              setSelectedMetas([meta]);
            }
            return;
          }
        }

        const headingEl = target.closest<HTMLElement>('h1, h2, h3, p');
        if (headingEl && headingEl !== container) {
          const rect = computeRelativeRect(headingEl);
          if (rect) {
            const blockId = `block-${Math.round(rect.top)}-${Math.round(rect.left)}`;
            const text = (headingEl.textContent || '').trim().slice(0, 16);
            const meta: SelectedElementMeta = {
              id: blockId,
              type: 'paragraph',
              label: `${headingEl.tagName}: ${text}`,
              rect,
              htmlTag: headingEl.tagName,
            };

            if (isShift) {
              setSelectedMetas((prev) => {
                const exists = prev.some((m) => m.id === blockId);
                if (exists) {
                  selectedDomMap.current.delete(blockId);
                  return prev.filter((m) => m.id !== blockId);
                } else {
                  selectedDomMap.current.set(blockId, headingEl);
                  return [...prev, meta];
                }
              });
            } else {
              selectedDomMap.current.clear();
              selectedDomMap.current.set(blockId, headingEl);
              setSelectedMetas([meta]);
            }
            return;
          }
        }
      }

      // 여백 클릭 시 선택 해제 (Shift 미입력 시)
      if (!isShift && (target === container || target.classList.contains('ProseMirror'))) {
        setSelectedMetas([]);
        selectedDomMap.current.clear();
      }
    };

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [cardRef, toolMode, computeRelativeRect, slotBindings, onSlotClick, pageNumber]);

  // 창 크기 조절 시 선택 박스 위치 일괄 재계산
  const refreshSelectedRects = useCallback(() => {
    setSelectedMetas((prev) =>
      prev
        .map((meta) => {
          const el = selectedDomMap.current.get(meta.id);
          if (!el) return meta;
          const rect = computeRelativeRect(el);
          return rect ? { ...meta, rect } : meta;
        })
        .filter(Boolean)
    );
  }, [computeRelativeRect]);

  useEffect(() => {
    window.addEventListener('resize', refreshSelectedRects);
    return () => window.removeEventListener('resize', refreshSelectedRects);
  }, [refreshSelectedRects]);

  // 다중 선택 시 전체 요소를 감싸는 통합 그룹 바운딩 박스 (Combined AABB Box)
  const combinedGroupRect = useMemo(() => {
    if (selectedMetas.length <= 1) return null;

    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    selectedMetas.forEach((meta) => {
      minTop = Math.min(minTop, meta.rect.top);
      minLeft = Math.min(minLeft, meta.rect.left);
      maxRight = Math.max(maxRight, meta.rect.left + meta.rect.width);
      maxBottom = Math.max(maxBottom, meta.rect.top + meta.rect.height);
    });

    if (minTop === Infinity) return null;

    return {
      top: minTop - 4,
      left: minLeft - 4,
      width: maxRight - minLeft + 8,
      height: maxBottom - minTop + 8,
    };
  }, [selectedMetas]);

  // 일괄 추천값 적용 핸들러
  const handleBatchApplySuggestions = () => {
    selectedMetas.forEach((meta) => {
      if (meta.slotId) {
        onAcceptSlotSuggestion?.(meta.slotId);
      }
    });
  };

  // 일괄 내용 비우기 핸들러
  const handleBatchClearValues = () => {
    selectedMetas.forEach((meta) => {
      if (meta.slotId) {
        onBindSlot?.(meta.slotId, '', '일괄 비우기');
      }
    });
  };

  return (
    <>
      {/* 1. 상단 미니 툴 스위처 (피그마식 V 선택 vs T 텍스트 편집 모드) */}
      <div
        data-overlay-interactive="true"
        className="absolute -top-11 right-0 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs border border-slate-800 p-1 rounded-lg shadow-lg z-30 select-none text-[11px]"
      >
        <button
          type="button"
          onClick={() => onChangeToolMode('select')}
          className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
            toolMode === 'select'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="요소 선택 모드 (V): 피그마처럼 마우스 드래그 박스로 여러 블록 일괄 선택 / Shift+클릭 누적 선택"
        >
          <MousePointer className="w-3 h-3" />
          <span>선택 (V)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeToolMode('text')}
          className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
            toolMode === 'text'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="텍스트 직접 입력 모드 (T): 서식 텍스트 인라인 편집"
        >
          <Type className="w-3 h-3" />
          <span>편집 (T)</span>
        </button>

        {selectedMetas.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedMetas([]);
              selectedDomMap.current.clear();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer ml-0.5"
            title="선택 해제 (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 2. 절대 좌표 오버레이 컨테이너 (A4 페이퍼 내부 흡착) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
        {/* [A] 마우스 호버 가이드라인 (Hover Bounding Box) */}
        {hoveredRect && toolMode === 'select' && !isMarqueeActive && (
          <div
            style={{
              top: `${hoveredRect.top}px`,
              left: `${hoveredRect.left}px`,
              width: `${hoveredRect.width}px`,
              height: `${hoveredRect.height}px`,
            }}
            className="absolute border border-dashed border-indigo-400/80 bg-indigo-500/5 transition-all duration-75 pointer-events-none"
          >
            <div className="absolute -top-5 left-0 bg-indigo-950/90 text-indigo-300 text-[9px] font-mono px-1 py-0.2 rounded-t border border-indigo-500/40 truncate max-w-[160px]">
              {hoveredRect.label}
            </div>
          </div>
        )}

        {/* [B] 마우스 드래그 마퀴 사각형 (Rubberband Marquee Area) */}
        {isMarqueeActive && marqueeRect && (
          <div
            style={{
              top: `${marqueeRect.top}px`,
              left: `${marqueeRect.left}px`,
              width: `${marqueeRect.width}px`,
              height: `${marqueeRect.height}px`,
            }}
            className="absolute bg-indigo-500/20 border-2 border-indigo-500 rounded-[2px] shadow-[0_0_15px_rgba(99,102,241,0.35)] pointer-events-none z-30"
          >
            <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-indigo-950 text-indigo-200 px-1 py-0.2 rounded border border-indigo-500/50">
              {Math.round(marqueeRect.width)} × {Math.round(marqueeRect.height)}
            </span>
          </div>
        )}

        {/* [C-1] 선택된 개별 블록들의 파란색 테두리 (개별 바운딩 프레임) */}
        {selectedMetas.map((meta) => {
          const isSingle = selectedMetas.length === 1;

          return (
            <div
              key={meta.id}
              style={{
                top: `${meta.rect.top}px`,
                left: `${meta.rect.left}px`,
                width: `${meta.rect.width}px`,
                height: `${meta.rect.height}px`,
              }}
              className={`absolute border-2 border-indigo-600 shadow-[0_0_0_1px_rgba(255,255,255,0.85)] pointer-events-none transition-all duration-75 ${
                !isSingle ? 'bg-indigo-500/10' : ''
              }`}
            >
              {/* 단일 선택일 때의 상단 컴포넌트 뱃지 태그 */}
              {isSingle && (
                <div
                  data-overlay-interactive="true"
                  className="absolute -top-6 left-[-2px] pointer-events-auto bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-t-[3px] shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  {meta.slotId && <span className="text-amber-300">#{meta.slotId}</span>}
                  <span>{meta.label}</span>
                  <span className="text-indigo-200 text-[9px] font-normal font-sans opacity-90">
                    {Math.round(meta.rect.width)} × {Math.round(meta.rect.height)}pt
                  </span>
                </div>
              )}

              {/* 단일 선택일 때의 4모서리 조절 핸들 */}
              {isSingle && (
                <>
                  <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-[1px] shadow-xs" />
                  <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-[1px] shadow-xs" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-[1px] shadow-xs" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-[1px] shadow-xs" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-white border border-indigo-600 rounded-[1px]" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-white border border-indigo-600 rounded-[1px]" />
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-2 bg-white border border-indigo-600 rounded-[1px]" />
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-2 bg-white border border-indigo-600 rounded-[1px]" />
                </>
              )}
            </div>
          );
        })}

        {/* [C-2] 다중 선택 시 통합 그룹 바운딩 프레임 (Combined Group Box) */}
        {combinedGroupRect && (
          <div
            style={{
              top: `${combinedGroupRect.top}px`,
              left: `${combinedGroupRect.left}px`,
              width: `${combinedGroupRect.width}px`,
              height: `${combinedGroupRect.height}px`,
            }}
            className="absolute border border-dashed border-indigo-500/90 shadow-[0_0_20px_rgba(99,102,241,0.25)] pointer-events-none z-25 transition-all duration-100"
          >
            {/* 상단 다중 그룹 뱃지 태그 */}
            <div
              data-overlay-interactive="true"
              className="absolute -top-6 left-[-1px] pointer-events-auto bg-indigo-700 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-t-[3px] shadow-md flex items-center gap-1.5 whitespace-nowrap"
            >
              <Layers className="w-3 h-3 text-amber-300" />
              <span>{selectedMetas.length}개 선택됨</span>
              <span className="text-indigo-200 text-[9px] font-normal font-sans opacity-90">
                {Math.round(combinedGroupRect.width)} × {Math.round(combinedGroupRect.height)}pt
              </span>
            </div>

            {/* 통합 그룹 4모서리 조절점 */}
            <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-[1px] shadow-xs" />
            <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-[1px] shadow-xs" />
            <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-[1px] shadow-xs" />
            <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-[1px] shadow-xs" />
          </div>
        )}

        {/* [D-1] 단일 선택 플로팅 퀵 액션 알약 툴바 */}
        {selectedMetas.length === 1 && (
          <div
            data-overlay-interactive="true"
            style={{
              top: selectedMetas[0].rect.top < 45 ? `${selectedMetas[0].rect.top + selectedMetas[0].rect.height + 8}px` : `${selectedMetas[0].rect.top - 38}px`,
              left: `${selectedMetas[0].rect.left}px`,
            }}
            className="absolute pointer-events-auto bg-slate-900/95 text-slate-100 p-1 rounded-lg border border-slate-750 shadow-xl flex items-center gap-1 z-30 select-none animate-in fade-in duration-100"
          >
            {selectedMetas[0].slotId && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectSlotsChange && selectedMetas[0].slotId) {
                      onSelectSlotsChange([selectedMetas[0].slotId]);
                    }
                  }}
                  className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                  title="우측 AI 프롬프트에 이 슬롯 및 문서 태그로 쏙 잡기"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI에 잡기</span>
                </button>

                {slotBindings[selectedMetas[0].slotId]?.suggestedValue && (
                  <button
                    type="button"
                    onClick={() => onAcceptSlotSuggestion?.(selectedMetas[0].slotId!)}
                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors shadow-xs"
                    title="AI 분석 추천값 주입"
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>추천값 적용</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onBindSlot?.(selectedMetas[0].slotId!, '', '값 초기화')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
                  title="내용 비우기"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                onChangeToolMode('text');
                const el = selectedDomMap.current.get(selectedMetas[0].id);
                el?.focus();
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
              title="텍스트 직접 입력 모드로 전환"
            >
              <Type className="w-3 h-3 text-indigo-400" />
              <span>내용 타이핑</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMetas([]);
                selectedDomMap.current.clear();
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="선택 해제"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* [D-2] 다중 선택 일괄 작업 플로팅 툴바 (Multi-selection Action Pill) */}
        {selectedMetas.length > 1 && combinedGroupRect && (
          <div
            data-overlay-interactive="true"
            style={{
              top: combinedGroupRect.top < 45 ? `${combinedGroupRect.top + combinedGroupRect.height + 8}px` : `${combinedGroupRect.top - 42}px`,
              left: `${combinedGroupRect.left}px`,
            }}
            className="absolute pointer-events-auto bg-slate-900/98 text-slate-100 p-1.5 rounded-lg border border-indigo-500/60 shadow-2xl flex items-center gap-2 z-30 select-none animate-in fade-in duration-150 backdrop-blur-md"
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold">
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>{selectedMetas.length}개 선택됨</span>
            </div>

            <button
              type="button"
              onClick={handleBatchApplySuggestions}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors shadow-xs"
              title="선택된 모든 슬롯에 AI 추천 데이터 일괄 주입"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>일괄 추천값 적용</span>
            </button>

            <button
              type="button"
              onClick={handleBatchClearValues}
              className="px-2 py-1 rounded hover:bg-rose-950/80 hover:text-rose-200 text-slate-300 border border-slate-700/60 flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
              title="선택된 모든 슬롯 내용 일괄 초기화"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>일괄 비우기</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMetas([]);
                selectedDomMap.current.clear();
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="선택 해제 (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
