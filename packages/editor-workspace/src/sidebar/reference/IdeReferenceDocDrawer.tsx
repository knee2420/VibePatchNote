import { useState, type ReactNode, type MouseEvent } from 'react';
import {
  FileText,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  Layers,
  BookOpen,
} from 'lucide-react';
import type { ReferenceDocumentItem } from '../types';

export interface IdeReferenceDocDrawerProps<T extends ReferenceDocumentItem = ReferenceDocumentItem> {
  isOpen: boolean;
  onClose: () => void;
  onPopoutToFloating?: () => void;
  documents?: T[];
  currentDoc?: T | null;
  onSelectDoc?: (doc: T) => void;
  width?: number;
  leftOffset?: number;
  onMouseDownResizer?: (e: MouseEvent<HTMLDivElement>) => void;
  title?: string;
  children?: ReactNode; // 문서 본문 뷰어 슬롯
}

/**
 * IdeReferenceDocDrawer
 * 좌측 사이드바에 도킹되어 스르륵 열리는 레퍼런스 원본 열람 드로어.
 * 우측 마우스 리사이저 핸들 내장, 문서 전환 드롭다운 및 퀵 탭 스트립, 플로팅 창 분리 버튼을 지원합니다.
 */
export function IdeReferenceDocDrawer<T extends ReferenceDocumentItem = ReferenceDocumentItem>({
  isOpen,
  onClose,
  onPopoutToFloating,
  documents = [],
  currentDoc,
  onSelectDoc,
  width = 580,
  leftOffset = 308,
  onMouseDownResizer,
  title = '레퍼런스 원본 DOC',
  children,
}: IdeReferenceDocDrawerProps<T>) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeDoc = currentDoc || documents[0] || null;
  const effectiveWidth = isMaximized ? Math.max(width, 820) : width;

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: `${leftOffset}px`,
        width: `${effectiveWidth}px`,
      }}
      className="fixed top-9 bottom-6 z-40 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col transition-all duration-200 select-none font-sans"
    >
      {/* 우측 마우스 리사이저 핸들 */}
      {onMouseDownResizer && (
        <div
          onMouseDown={onMouseDownResizer}
          className="absolute right-0 top-0 bottom-0 w-1.5 -mr-1 cursor-col-resize z-50 hover:bg-teal-500 transition-colors flex items-center justify-center group"
          title="드래그하여 레퍼런스 패널 너비 조절"
        >
          <div className="w-[1px] h-full bg-slate-800 group-hover:bg-teal-400" />
        </div>
      )}

      {/* 1. 상단 헤더 */}
      <div className="h-10 px-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-950/70">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-slate-100 shrink-0 tracking-wide">
            {title}
          </span>

          {/* 문서 선택 드롭다운 */}
          {documents.length > 0 && (
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700/60 truncate max-w-[200px] cursor-pointer transition-colors"
              >
                <span className="truncate">{activeDoc?.name || '문서 선택'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 max-h-64 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 text-xs">
                  <div className="px-2 py-1 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    참고 원본 문서 목록 ({documents.length})
                  </div>
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
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                      {doc.format && (
                        <span className="text-[9px] text-slate-500 font-mono uppercase shrink-0">
                          {doc.format}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 헤더 우측 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {/* 플로팅 팝업으로 띄우기 */}
          {onPopoutToFloating && (
            <button
              type="button"
              onClick={onPopoutToFloating}
              className="flex items-center gap-1 px-2 py-1 rounded bg-teal-600/25 hover:bg-teal-600/40 text-teal-300 hover:text-white text-[11px] font-semibold border border-teal-500/40 cursor-pointer shadow-xs transition-all mr-1"
              title="창을 분리하여 화면 위에 항상 떠 있는 플로팅 레퍼런스로 띄우기"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>팝업으로 띄우기</span>
            </button>
          )}

          {/* 와이드 뷰 토글 */}
          <button
            type="button"
            onClick={() => setIsMaximized((v) => !v)}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title={isMaximized ? '기본 너비로 복원' : '와이드 패널로 확장'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
            title="패널 닫기 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 퀵 탭 스트립 (주요 문서 1클릭 전환) */}
      {documents.length > 1 && (
        <div className="px-3 py-1.5 border-b border-slate-800/60 bg-slate-925/40 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none shrink-0">
          <span className="text-slate-500 text-[10px] shrink-0 font-sans">빠른 전환:</span>
          {documents.slice(0, 5).map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelectDoc?.(doc)}
              className={`px-2 py-0.5 rounded text-[10px] truncate max-w-[130px] border cursor-pointer transition-colors ${
                activeDoc?.id === doc.id
                  ? 'bg-teal-950/90 text-teal-300 border-teal-700/60 font-semibold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
              title={doc.name}
            >
              {doc.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. 본문 뷰어 영역 (주입형 children 슬롯) */}
      <div className="flex-1 overflow-y-auto p-2 text-slate-200 flex flex-col relative">
        {children || (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
            <BookOpen className="w-8 h-8 text-slate-600" />
            <p>표시할 레퍼런스 문서가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 4. 하단 안내 바 */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="truncate">
          💡 '팝업으로 띄우기'를 누르면 작업 도중 화면 위에 계속 띄워둘 수 있습니다.
        </span>
        {onPopoutToFloating && (
          <button
            type="button"
            onClick={onPopoutToFloating}
            className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            <span>플로팅 창으로 분리</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
