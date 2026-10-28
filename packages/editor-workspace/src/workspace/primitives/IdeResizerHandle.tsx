import type { MouseEvent } from 'react';

export type ResizerOrientation = 'vertical' | 'horizontal';
export type ResizerColorVariant = 'indigo' | 'amber' | 'default';

export interface IdeResizerHandleProps {
  /** 리사이저 방향 ('vertical': 좌우 너비 조절, 'horizontal': 상하 높이 조절) */
  orientation?: ResizerOrientation;
  /** 마우스 다운 이벤트 핸들러 (드래그 시작) */
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  /** 툴팁 설명 (예: "드래그하여 패널 너비 조절") */
  title?: string;
  /** 호버 시 하이라이트 색상 (기본값: 'indigo') */
  colorVariant?: ResizerColorVariant;
  className?: string;
}

/**
 * [Primitive] IDE 패널 간의 마우스 드래그 분할 리사이저 핸들 부품.
 * 
 * - vertical: 좌/우 사이드바 또는 에디터 분할 (cursor-col-resize)
 * - horizontal: 하단 도킹 터미널 높이 조절 (cursor-row-resize)
 * - 호버 시 부드러운 하이라이트 라인 렌더링
 */
export function IdeResizerHandle({
  orientation = 'vertical',
  onMouseDown,
  title,
  colorVariant = 'indigo',
  className = '',
}: IdeResizerHandleProps) {
  const isVertical = orientation === 'vertical';

  const hoverColorClass =
    colorVariant === 'amber'
      ? 'group-hover:bg-amber-400'
      : colorVariant === 'indigo'
      ? 'group-hover:bg-indigo-400'
      : 'group-hover:bg-slate-500';

  const hoverBgClass =
    colorVariant === 'amber'
      ? 'hover:bg-amber-500/50'
      : colorVariant === 'indigo'
      ? 'hover:bg-indigo-500/50'
      : 'hover:bg-slate-700/50';

  if (isVertical) {
    return (
      <div
        onMouseDown={onMouseDown}
        className={`w-1.5 -ml-1 h-full cursor-col-resize z-20 ${hoverBgClass} transition-colors flex items-center justify-center group shrink-0 select-none ${className}`}
        title={title}
      >
        <div className={`w-[1px] h-full bg-slate-800 ${hoverColorClass} transition-colors`} />
      </div>
    );
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className={`h-1.5 -mt-1 w-full cursor-row-resize z-20 ${hoverBgClass} transition-colors flex items-center justify-center group shrink-0 select-none ${className}`}
      title={title}
    >
      <div className={`h-[1px] w-full bg-slate-800 ${hoverColorClass} transition-colors`} />
    </div>
  );
}
