import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ScrollText,
  FileText,
  BookOpen,
  Maximize,
} from 'lucide-react';
import type { PaginationBarProps } from './types';

/**
 * 워크스페이스 상태바 또는 에디터 하단에 탑재되는 페이지네이션 & 뷰 레이아웃 컨트롤러.
 */
export function PaginationBar({
  currentPage,
  totalPages,
  zoom = 100,
  layoutMode = 'continuous',
  onPageChange,
  onZoomChange,
  onLayoutModeChange,
  showZoom = true,
  showLayoutModes = true,
  className = '',
}: PaginationBarProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.max(1, Math.min(safeTotalPages, currentPage));

  const handlePrev = () => {
    if (safeCurrentPage > 1) {
      onPageChange?.(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < safeTotalPages) {
      onPageChange?.(safeCurrentPage + 1);
    }
  };

  const handleZoomIn = () => {
    if (onZoomChange) {
      onZoomChange(Math.min(200, zoom + 10));
    }
  };

  const handleZoomOut = () => {
    if (onZoomChange) {
      onZoomChange(Math.max(50, zoom - 10));
    }
  };

  return (
    <div
      className={`flex items-center gap-3 text-xs text-slate-400 select-none ${className}`}
    >
      {/* 1. 페이지 넘김 네비게이터 */}
      {onPageChange && (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={handlePrev}
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="이전 페이지 (Page Up)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono text-[11px] text-slate-300">
            <strong>{safeCurrentPage}</strong> / {safeTotalPages} 쪽
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={handleNext}
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="다음 페이지 (Page Down)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. 줌 배율 조절기 */}
      {showZoom && onZoomChange && (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            disabled={zoom <= 50}
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="축소 (Zoom Out)"
          >
            <Minus className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(100)}
            className="px-1.5 font-mono text-[11px] text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
            title="100% 배율로 리셋"
          >
            {zoom}%
          </button>

          <button
            type="button"
            disabled={zoom >= 200}
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="확대 (Zoom In)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. 4대 뷰 레이아웃 모드 토글 */}
      {showLayoutModes && onLayoutModeChange && (
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onLayoutModeChange('continuous')}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutMode === 'continuous'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="연속 스크롤 뷰 (웹 레이아웃)"
          >
            <ScrollText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onLayoutModeChange('paged')}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutMode === 'paged'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="A4 낱장 분할 인쇄 뷰"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onLayoutModeChange('spread')}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutMode === 'spread'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="2쪽 나란히 보기 (양면 스프레드)"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onLayoutModeChange('zen')}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutMode === 'zen'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="방해요소 없는 집중 모드 (Zen Mode)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
