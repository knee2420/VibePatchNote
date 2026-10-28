import { NodeResizer, type OnResize, type OnResizeEnd, type OnResizeStart } from '@xyflow/react';

interface CardResizeFrameProps {
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
  onResizeStart: OnResizeStart;
  onResize: OnResize;
  onResizeEnd: OnResizeEnd;
}

/** 카드 테두리 호버/선택 시 나타나는 크기 조절 프레임. */
export function CardResizeFrame({
  selected,
  minWidth = 360,
  minHeight = 260,
  onResizeStart,
  onResize,
  onResizeEnd,
}: CardResizeFrameProps) {
  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      isVisible={true}
      onResizeStart={onResizeStart}
      onResize={onResize}
      onResizeEnd={onResizeEnd}
      lineClassName={`border-blue-500 pointer-events-none transition-opacity duration-150 ${
        selected ? 'opacity-90' : 'opacity-0 group-hover/node:opacity-60'
      }`}
      handleClassName={`!w-2.5 !h-2.5 !bg-white !border-2 !border-blue-500 !rounded-full shadow-xs transition-opacity duration-150 ${
        selected ? '!opacity-100' : '!opacity-0 group-hover/node:!opacity-100'
      }`}
    />
  );
}
