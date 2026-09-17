import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ArrowDownLeft,
  Move,
  BookOpen,
} from 'lucide-react';
import type { ResourceItem } from '../model/types';
import { A4DocumentViewer } from './A4DocumentViewer';

export interface FloatingReferenceWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onDockToPanel: () => void;
  referenceDocuments: ResourceItem[];
  currentDoc: ResourceItem | null;
  onSelectDoc: (doc: ResourceItem) => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export function FloatingReferenceWindow({
  isOpen,
  onClose,
  onDockToPanel,
  referenceDocuments,
  currentDoc,
  onSelectDoc,
  initialPosition = { x: 340, y: 70 },
  initialSize = { width: 440, height: 600 },
}: FloatingReferenceWindowProps) {
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

  const activeDoc = currentDoc || referenceDocuments[0] || null;

  // 1. 창 위치 드래그 이동 핸들러
  const handleMouseDownHeader = (e: React.MouseEvent) => {
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

  // 2. 창 크기 조절 (우하단 청록색 핸들)
  const handleMouseDownResizer = (e: React.MouseEvent) => {
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
    const handleMouseMove = (e: MouseEvent) => {
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

  // 최소화된 칩/알약 상태
  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-teal-500/60 shadow-2xl backdrop-blur-md text-xs text-slate-100 font-sans cursor-move select-none animate-in fade-in"
        onMouseDown={handleMouseDownHeader}
      >
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <FileText className="w-3.5 h-3.5 text-teal-400" />
        <span className="font-semibold truncate max-w-[160px]">{activeDoc?.name || '레퍼런스 창'}</span>
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
      className="fixed z-50 flex flex-col bg-slate-900/98 backdrop-blur-2xl rounded-xl border border-slate-700/80 shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. 상단 드래그 헤더 바 */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-10 px-3 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 cursor-move"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/40 shrink-0">
            <Move className="w-3 h-3" />
          </span>

          {/* 레퍼런스 문서 드롭다운 선택기 */}
          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-slate-200 text-xs font-semibold truncate max-w-full cursor-pointer transition-colors"
              title="레퍼런스 문서 전환"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">{activeDoc?.name || '문서 선택'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 text-xs">
                <div className="px-2 py-1 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  참고 원본 문서 목록 ({referenceDocuments.length})
                </div>
                {referenceDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      onSelectDoc(doc);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left cursor-pointer transition-colors ${
                      activeDoc?.id === doc.id
                        ? 'bg-teal-950/80 text-teal-300 font-semibold border border-teal-800/50'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase shrink-0">
                      {doc.format}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 헤더 우측 컨트롤 버튼 그룹 */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {/* 패널로 도킹 복원 버튼 */}
          <button
            type="button"
            onClick={onDockToPanel}
            className="p-1 rounded hover:bg-slate-800 hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
            title="좌측 슬라이드 패널로 도킹 복원"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">도킹</span>
          </button>

          {/* 최소화 버튼 */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="최소화"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
            title="레퍼런스 창 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 메인 레퍼런스 본문 뷰어 (A4DocumentViewer 연동) */}
      <div className="flex-1 overflow-hidden p-2 text-slate-200 flex flex-col relative">
        {activeDoc ? (
          <A4DocumentViewer resource={activeDoc} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
            <BookOpen className="w-8 h-8 text-slate-600" />
            <p>표시할 레퍼런스 문서가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 3. 하단 상태 바 & 프로크리에이트 스타일 청록색 리사이즈 핸들 */}
      <div className="h-6 px-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 shrink-0 font-mono">
        <span className="truncate">
          💡 창을 자유롭게 드래그하여 배치할 수 있습니다.
        </span>
        <div className="flex items-center gap-1.5">
          <span>{size.width}×{size.height}</span>
          {/* 프로크리에이트 스타일 청록색 코너 리사이저 핸들 */}
          <div
            onMouseDown={handleMouseDownResizer}
            className="w-4 h-4 -mr-1.5 -mb-1 flex items-center justify-center cursor-nwse-resize group"
            title="모서리를 드래그하여 레퍼런스 창 크기 조절"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-teal-400 group-hover:border-teal-300 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
