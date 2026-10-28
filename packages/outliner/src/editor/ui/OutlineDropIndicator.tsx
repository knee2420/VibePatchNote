/**
 * @file OutlineDropIndicator.tsx
 * @description 끌고 있는 불릿을 놓으면 들어갈 자리를 보여주는 파란 선
 */

import React from 'react';
import type { DropPosition } from '../../core';

interface OutlineDropIndicatorProps {
  position: DropPosition;
  depth: number;
}

const INDENT_PX = 24;
/** 손잡이·화살표를 지나 불릿 점이 시작되는 위치 */
const BULLET_OFFSET_PX = 36;

export const OutlineDropIndicator: React.FC<OutlineDropIndicatorProps> = ({ position, depth }) => {
  const isInside = position === 'inside' || position === 'inside-start';
  const left = (depth + (isInside ? 1 : 0)) * INDENT_PX + BULLET_OFFSET_PX;

  return (
    <div
      className={`absolute right-0 h-[2px] rounded-full bg-(--interactive-accent) shadow-[0_0_8px_rgba(99,102,241,0.6)] pointer-events-none z-10 ${
        position === 'before' ? '-top-px' : '-bottom-px'
      }`}
      style={{ left }}
    >
      <span className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-(--interactive-accent)" />
    </div>
  );
};
