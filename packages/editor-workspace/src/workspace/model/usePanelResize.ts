import { useState, useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

export interface UsePanelResizeOptions {
  /** 현재 초기 크기 (px) */
  initialSize?: number;
  /** 최소 크기 (px) */
  min?: number;
  /** 최대 크기 (px) */
  max?: number;
  /** 리사이저 방향 ('vertical': 좌우 너비 조절, 'horizontal': 상하 높이 조절) */
  orientation?: 'vertical' | 'horizontal';
  /** delta 계산 방향 ('normal': 좌->우/상->하로 증가, 'inverse': 우->좌/하->상으로 증가) */
  direction?: 'normal' | 'inverse';
  /** 크기 변경 시 호출될 콜백 */
  onSizeChange?: (size: number) => void;
  /** 드래그 시작 시 콜백 (예: setIsDraggingAnyResizer(true)) */
  onDragStart?: () => void;
  /** 드래그 종료 시 콜백 (예: setIsDraggingAnyResizer(false)) */
  onDragEnd?: () => void;
}

export interface UsePanelResizeReturn {
  /** 현재 패널 크기 (px) */
  size: number;
  /** 패널 크기 수동 변경 setter */
  setSize: React.Dispatch<React.SetStateAction<number>>;
  /** 현재 마우스 드래그 중 여부 */
  isDragging: boolean;
  /** 리사이저 핸들에 연결할 onMouseDown 이벤트 핸들러 */
  handleMouseDown: (e: ReactMouseEvent) => void;
}

/**
 * [Primitive Hook] 패널 간 마우스 드래그 리사이징 이벤트를 추적하는 범용 관절 훅.
 * 
 * - mousemove / mouseup 전역 이벤트 등록 및 자동 클린업
 * - min / max 범위 클램핑 (Math.max, Math.min)
 * - 좌우(vertical)/상하(horizontal) 및 정방향/역방향(inverse) 지원
 */
export function usePanelResize({
  initialSize = 280,
  min = 100,
  max = 800,
  orientation = 'vertical',
  direction = 'normal',
  onSizeChange,
  onDragStart,
  onDragEnd,
}: UsePanelResizeOptions = {}): UsePanelResizeReturn {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      onDragStart?.();

      const startCoord = orientation === 'vertical' ? e.clientX : e.clientY;
      const startSize = sizeRef.current;

      const handleMouseMove = (ev: MouseEvent) => {
        const currentCoord = orientation === 'vertical' ? ev.clientX : ev.clientY;
        const delta = direction === 'inverse' ? startCoord - currentCoord : currentCoord - startCoord;
        const nextSize = Math.max(min, Math.min(max, startSize + delta));

        setSize(nextSize);
        onSizeChange?.(nextSize);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onDragEnd?.();
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [min, max, orientation, direction, onSizeChange, onDragStart, onDragEnd]
  );

  return {
    size,
    setSize,
    isDragging,
    handleMouseDown,
  };
}
