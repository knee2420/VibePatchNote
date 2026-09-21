import type { IdeWindowShellProps } from './types';
import { IdeResizerHandle } from './primitives/IdeResizerHandle';

/**
 * [IDE Mode] 데스크톱 IDE 스타일의 최외곽 샌드위치 윈도우 셸.
 * 
 * - 상단: 윈도우 헤더 슬롯 (IdeWindowHeader)
 * - 중앙: flex-1 본문 작업 영역 (IdeDockLayout 등)
 * - 하단: 상태표시줄 슬롯 (IdeStatusBar)
 * - 전역 드래그 리사이징 중 텍스트 선택 방지(select-none) 및 커서 스타일을 총괄 관리합니다.
 */
export function IdeWindowShell({
  header,
  children,
  footer,
  isDraggingResizer = false,
  dragCursor = 'col-resize',
  className = '',
}: IdeWindowShellProps) {
  const cursorClass =
    isDraggingResizer
      ? dragCursor === 'row-resize'
        ? 'select-none cursor-row-resize'
        : 'select-none cursor-col-resize'
      : 'select-none';

  return (
    <div
      className={`w-full h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden ${cursorClass} ${className}`}
    >
      {/* 1. 최상단 윈도우 프레임 & 헤더 영역 */}
      {header && <header className="shrink-0 z-30">{header}</header>}

      {/* 2. 중앙 메인 도킹 작업 본문 영역 */}
      <div className="flex-1 flex overflow-hidden relative">
        {children}
      </div>

      {/* 3. 최하단 상태표시줄 영역 */}
      {footer && <footer className="shrink-0 z-30">{footer}</footer>}
    </div>
  );
}

// Compound 부품 연결
IdeWindowShell.Resizer = IdeResizerHandle;
