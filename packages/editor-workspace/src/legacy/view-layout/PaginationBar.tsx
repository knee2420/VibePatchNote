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
      className={`flex items-center gap-3 text-xs text-slate-500 select-none ${className}`}
    >
      {/* 1. 페이지 넘김 네비게이터 */}
      {onPageChange && (
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={handlePrev}
            className="p-1 rounded hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="이전 페이지 (Page Up)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono text-[11px] text-slate-700">
            <strong>{safeCurrentPage}</strong> / {safeTotalPages} 쪽
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={handleNext}
            className="p-1 rounded hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="다음 페이지 (Page Down)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. 줌 배율 조절기 */}
      {showZoom && onZoomChange && (
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={zoom <= 50}
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
            title="축소 (Zoom Out)"
          >
            <Minus className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(100)}
            className="px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
            title="100% 원본 배율로 리셋"
          >
            {zoom}%
          </button>

          <button
            type="button"
            disabled={zoom >= 200}
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
            title="확대 (Zoom In)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. 4대 뷰 레이아웃 모드 토글 */}
      {showLayoutModes && onLayoutModeChange && (
        <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onLayoutModeChange('continuous')}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutMode === 'continuous'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
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
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
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
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
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
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
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
