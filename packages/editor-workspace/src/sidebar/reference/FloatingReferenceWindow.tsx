import { useState, useRef, useEffect, type ReactNode, type MouseEvent } from 'react';
import {
  FileText,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ArrowDownLeft,
  Move,
} from 'lucide-react';
import type { ReferenceDocumentItem } from '../types';

export interface FloatingReferenceWindowProps<T extends ReferenceDocumentItem = ReferenceDocumentItem> {
  isOpen: boolean;
  onClose: () => void;
  onDockToPanel?: () => void;
  documents?: T[];
  currentDoc?: T | null;
  onSelectDoc?: (doc: T) => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  title?: string;
  children?: ReactNode; // 문서 본문 뷰어 슬롯
}

/**
 * FloatingReferenceWindow
 * 화면 위에 독립적으로 떠 있는 플로팅 레퍼런스 윈도우.
 * 헤더 마우스 드래그 이동, 우하단 리사이저 핸들 크기 조절, 최소화 알약 토글, 도킹 복원 지원.
 */
export function FloatingReferenceWindow<T extends ReferenceDocumentItem = ReferenceDocumentItem>({
  isOpen,
  onClose,
  onDockToPanel,
  documents = [],
  currentDoc,
  onSelectDoc,
  initialPosition = { x: 340, y: 70 },
  initialSize = { width: 460, height: 600 },
  title = '레퍼런스 원본 DOC',
  children,
}: FloatingReferenceWindowProps<T>) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 드래그 상태
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // 리사이징 상태
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  const activeDoc = currentDoc || documents[0] || null;

  // 1. 창 위치 드래그 이동 핸들러
  const handleMouseDownHeader = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) {
      return;
    }
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  // 2. 창 크기 조절 (우하단 리사이저 핸들)
  const handleMouseDownResizer = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDraggingRef.current) {
        const nextX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragStartOffsetRef.current.x));
        const nextY = Math.max(40, Math.min(window.innerHeight - 80, e.clientY - dragStartOffsetRef.current.y));
        setPosition({ x: nextX, y: nextY });
      } else if (isResizingRef.current) {
        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        const deltaY = e.clientY - resizeStartRef.current.mouseY;
        const newW = Math.max(300, Math.min(window.innerWidth - 60, resizeStartRef.current.startW + deltaX));
        const newH = Math.max(260, Math.min(window.innerHeight - 100, resizeStartRef.current.startH + deltaY));
        setSize({ width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  // 최소화된 캡슐 알약 상태
  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-teal-500/60 shadow-2xl backdrop-blur-md text-xs text-slate-100 font-sans cursor-move select-none"
        onMouseDown={handleMouseDownHeader}
      >
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <FileText className="w-3.5 h-3.5 text-teal-400" />
        <span className="font-semibold truncate max-w-[160px]">{activeDoc?.name || title}</span>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-1"
          title="창 펼치기"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
          title="닫기"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      className="fixed z-50 flex flex-col bg-slate-900/98 backdrop-blur-2xl rounded-xl border border-slate-700/80 shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden font-sans select-none"
    >
      {/* 1. 상단 드래그 이동 헤더 바 */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-9.5 px-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between cursor-move shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Move className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold text-slate-100 truncate">{title}</span>

          {/* 문서 선택 드롭다운 */}
          {documents.length > 0 && (
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60 truncate max-w-[170px] cursor-pointer"
              >
                <span className="truncate">{activeDoc?.name || '문서 선택'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 text-xs">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        onSelectDoc?.(doc);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left cursor-pointer transition-colors ${
                        activeDoc?.id === doc.id
                          ? 'bg-teal-950/80 text-teal-300 font-semibold border border-teal-800/50'
                          : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{doc.name}</span>
                      {doc.format && (
                        <span className="text-[9px] text-slate-500 uppercase">{doc.format}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 헤더 우측 조작 버튼 */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {/* 패널로 되돌리기 (도킹) */}
          {onDockToPanel && (
            <button
              type="button"
              onClick={onDockToPanel}
              className="p-1 rounded hover:bg-slate-800 hover:text-teal-300 transition-colors cursor-pointer"
              title="사이드 패널로 다시 도킹하기"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 최소화 버튼 */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="창 최소화 (알약 상태로 축소)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="창 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 본문 뷰어 슬롯 */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-900/60 flex flex-col relative">
        {children}
      </div>

      {/* 3. 우하단 리사이저 코너 핸들 */}
      <div
        onMouseDown={handleMouseDownResizer}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 group z-10"
        title="드래그하여 창 크기 조절"
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-teal-500/70 group-hover:border-teal-300 transition-colors" />
      </div>
    </div>
  );
}
