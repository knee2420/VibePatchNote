import { useState, useRef, useCallback, type ReactNode } from 'react';

export interface WorkspaceShellProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  sidebarWidth?: number;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  showSidebar?: boolean;
  onSidebarWidthChange?: (width: number) => void;
  children: ReactNode;
  inspector?: ReactNode;
  inspectorWidth?: number;
  minInspectorWidth?: number;
  maxInspectorWidth?: number;
  showInspector?: boolean;
  onInspectorWidthChange?: (width: number) => void;
  statusBar?: ReactNode;
  className?: string;
}

/**
 * Antigravity IDE + Scrivener 감성의 3단 워크스페이스 프레임워크 셸.
 * 상단 헤더, 좌측 바인더 패널, 중앙 워크스페이스 도킹 영역, 우측 인스펙터 패널, 하단 상태 바를 제공하며,
 * 마우스 드래그를 통한 부드러운 패널 너비 리사이징을 지원합니다.
 */
export function WorkspaceShell({
  header,
  sidebar,
  sidebarWidth = 260,
  minSidebarWidth = 180,
  maxSidebarWidth = 500,
  showSidebar = true,
  onSidebarWidthChange,
  children,
  inspector,
  inspectorWidth = 320,
  minInspectorWidth = 220,
  maxInspectorWidth = 600,
  showInspector = true,
  onInspectorWidthChange,
  statusBar,
  className = '',
}: WorkspaceShellProps) {
  const [currentSidebarWidth, setCurrentSidebarWidth] = useState(sidebarWidth);
  const [currentInspectorWidth, setCurrentInspectorWidth] = useState(inspectorWidth);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingInspector, setIsDraggingInspector] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 좌측 사이드바 드래그 리사이징 핸들러
  const handleSidebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingSidebar(true);

      const startX = e.clientX;
      const initialWidth = currentSidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(
          minSidebarWidth,
          Math.min(maxSidebarWidth, initialWidth + delta)
        );
        setCurrentSidebarWidth(newWidth);
        onSidebarWidthChange?.(newWidth);
      };

      const handleMouseUp = () => {
        setIsDraggingSidebar(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [currentSidebarWidth, minSidebarWidth, maxSidebarWidth, onSidebarWidthChange]
  );

  // 우측 인스펙터 드래그 리사이징 핸들러
  const handleInspectorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingInspector(true);

      const startX = e.clientX;
      const initialWidth = currentInspectorWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.max(
          minInspectorWidth,
          Math.min(maxInspectorWidth, initialWidth + delta)
        );
        setCurrentInspectorWidth(newWidth);
        onInspectorWidthChange?.(newWidth);
      };

      const handleMouseUp = () => {
        setIsDraggingInspector(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [currentInspectorWidth, minInspectorWidth, maxInspectorWidth, onInspectorWidthChange]
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden ${
        isDraggingSidebar || isDraggingInspector ? 'select-none cursor-col-resize' : 'select-none'
      } ${className}`}
    >
      {/* 1. 상단 헤더 슬롯 */}
      {header && <header className="shrink-0 z-20">{header}</header>}

      {/* 2. 본문 3단 레이아웃 */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* [좌측 바인더 패널] */}
        {showSidebar && sidebar && (
          <>
            <aside
              style={{ width: `${currentSidebarWidth}px` }}
              className="h-full shrink-0 bg-slate-900/60 flex flex-col overflow-hidden z-10 transition-none"
            >
              {sidebar}
            </aside>
            {/* 좌측 리사이저 핸들 */}
            <div
              onMouseDown={handleSidebarMouseDown}
              className="w-1.5 -ml-1 h-full cursor-col-resize z-20 hover:bg-purple-500/60 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 사이드바 너비 조절"
            >
              <div className="w-[1px] h-full bg-slate-800/90 group-hover:bg-purple-400 transition-colors" />
            </div>
          </>
        )}

        {/* [중앙 워크스페이스 도킹 영역] */}
        <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-slate-950 min-w-0">
          {children}
        </main>

        {/* [우측 인스펙터 & 속성 패널] */}
        {showInspector && inspector && (
          <>
            {/* 우측 리사이저 핸들 */}
            <div
              onMouseDown={handleInspectorMouseDown}
              className="w-1.5 -mr-1 h-full cursor-col-resize z-20 hover:bg-purple-500/60 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 패널 너비 조절"
            >
              <div className="w-[1px] h-full bg-slate-800/90 group-hover:bg-purple-400 transition-colors" />
            </div>
            <aside
              style={{ width: `${currentInspectorWidth}px` }}
              className="h-full shrink-0 bg-slate-900/60 flex flex-col overflow-hidden z-10 transition-none"
            >
              {inspector}
            </aside>
          </>
        )}
      </div>

      {/* 3. 하단 상태 바 슬롯 */}
      {statusBar && (
        <footer className="shrink-0 z-20 border-t border-slate-800 bg-slate-900/80">
          {statusBar}
        </footer>
      )}
    </div>
  );
}
