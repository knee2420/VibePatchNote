import type { CSSProperties } from 'react';

import type { ResizeHandle } from './geometry';

interface SegmentResizeHandlesProps {
  onHandleMouseDown: (handle: ResizeHandle, e: React.MouseEvent) => void;
}

const HANDLE_DOT =
  'w-2.5 h-2.5 bg-white border-2 border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 transition-transform';

/** 네 모서리. 위치/커서만 다르고 나머지는 같습니다. */
const CORNERS: Array<{ handle: ResizeHandle; className: string; title: string }> = [
  {
    handle: 'tl',
    className:
      'absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 nodrag nopan group/handle',
    title: '크기 조절 (좌상단)',
  },
  {
    handle: 'tr',
    className:
      'absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 nodrag nopan group/handle',
    title: '크기 조절 (우상단)',
  },
  {
    handle: 'br',
    className:
      'absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 nodrag nopan group/handle',
    title: '크기 조절 (우하단)',
  },
  {
    handle: 'bl',
    className:
      'absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 nodrag nopan group/handle',
    title: '크기 조절 (좌하단)',
  },
];

/** 네 변. 테두리 선 전체가 리사이즈 영역이고, 정중앙에 알약 핸들이 보입니다. */
const EDGES: Array<{
  handle: ResizeHandle;
  style: CSSProperties;
  className: string;
  hitClassName: string;
  pillStyle: CSSProperties;
  pillClassName: string;
  title: string;
}> = [
  {
    handle: 't',
    style: { top: '-4px', left: '0px', right: '0px', height: '8px' },
    className: 'absolute cursor-ns-resize z-30 nodrag nopan group/top-edge',
    hitClassName: 'w-full h-full bg-transparent group-hover/top-edge:bg-purple-500/50 transition-colors',
    pillStyle: { left: '50%', transform: 'translateX(-50%)', top: '1px' },
    pillClassName:
      'absolute w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/top-edge:scale-115 transition-transform',
    title: '상단 높이 조절',
  },
  {
    handle: 'b',
    style: { bottom: '-4px', left: '0px', right: '0px', height: '8px' },
    className: 'absolute cursor-ns-resize z-30 nodrag nopan group/bottom-edge',
    hitClassName:
      'w-full h-full bg-transparent group-hover/bottom-edge:bg-purple-500/50 transition-colors',
    pillStyle: { left: '50%', transform: 'translateX(-50%)', bottom: '1px' },
    pillClassName:
      'absolute w-8 h-2 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/bottom-edge:scale-115 transition-transform',
    title: '하단 높이 조절',
  },
  {
    handle: 'l',
    style: { left: '-4px', top: '0px', bottom: '0px', width: '8px' },
    className: 'absolute cursor-ew-resize z-30 nodrag nopan group/left-edge',
    hitClassName:
      'w-full h-full bg-transparent group-hover/left-edge:bg-purple-500/50 transition-colors',
    pillStyle: { top: '50%', transform: 'translateY(-50%)', left: '1px' },
    pillClassName:
      'absolute w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/left-edge:scale-115 transition-transform',
    title: '좌측 너비 조절',
  },
  {
    handle: 'r',
    style: { right: '-4px', top: '0px', bottom: '0px', width: '8px' },
    className: 'absolute cursor-ew-resize z-30 nodrag nopan group/right-edge',
    hitClassName:
      'w-full h-full bg-transparent group-hover/right-edge:bg-purple-500/50 transition-colors',
    pillStyle: { top: '50%', transform: 'translateY(-50%)', right: '1px' },
    pillClassName:
      'absolute w-2 h-8 bg-white border-2 border-purple-600 rounded-full shadow-md pointer-events-none group-hover/right-edge:scale-115 transition-transform',
    title: '우측 너비 조절',
  },
];

/** 선택된 세그먼트의 4모서리 + 4변 리사이즈 핸들. */
export function SegmentResizeHandles({ onHandleMouseDown }: SegmentResizeHandlesProps) {
  return (
    <>
      {CORNERS.map((corner) => (
        <div
          key={corner.handle}
          onMouseDown={(e) => onHandleMouseDown(corner.handle, e)}
          className={corner.className}
          title={corner.title}
        >
          <div className={HANDLE_DOT} />
        </div>
      ))}

      {EDGES.map((edge) => (
        <div
          key={edge.handle}
          onMouseDown={(e) => onHandleMouseDown(edge.handle, e)}
          style={edge.style}
          className={edge.className}
          title={edge.title}
        >
          <div className={edge.hitClassName} />
          <div style={edge.pillStyle} className={edge.pillClassName} />
        </div>
      ))}
    </>
  );
}
