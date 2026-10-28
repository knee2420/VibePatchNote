import {
  Rows3,
  Columns2,
  PenLine,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
} from 'lucide-react';
import type { WireframeViewMode } from '../model/types';

export interface WireframeViewModeBarProps {
  viewMode: WireframeViewMode;
  onChangeViewMode: (mode: WireframeViewMode) => void;

  // 가로 페이징 상태
  horizontalPage: number;
  totalHorizontalPages: number;
  onChangeHorizontalPage: (page: number) => void;
  horizontalSpread: 1 | 2; // 1: 단면, 2: 양면
  onChangeHorizontalSpread: (spread: 1 | 2) => void;

  // 그리드 조망 상태
  gridCols: 2 | 3 | 4;
  onChangeGridCols: (cols: 2 | 3 | 4) => void;
  gridScale: number; // 0.4 ~ 0.8
  onChangeGridScale: (scale: number) => void;
}

export function WireframeViewModeBar({
  viewMode,
  onChangeViewMode,
  horizontalPage,
  totalHorizontalPages,
  onChangeHorizontalPage,
  horizontalSpread,
  onChangeHorizontalSpread,
  gridCols,
  onChangeGridCols,
  gridScale,
  onChangeGridScale,
}: WireframeViewModeBarProps) {
  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* 1. 4가지 뷰 모드 세그먼트 컨트롤 버튼 그룹 */}
      <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 shadow-inner shrink-0">
        {/* 모드 1: 세로 연속 뷰 (기본값) */}
        <button
          type="button"
          onClick={() => onChangeViewMode('vertical')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
            viewMode === 'vertical'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="세로로 페이지들을 쭉 이어 스크롤하며 보는 기본 뷰"
        >
          <Rows3 className="w-3.5 h-3.5" />
          <span>세로 연속</span>
        </button>

        {/* 모드 2: 가로 전환 (페이지네이션 & 스프레드) */}
        <button
          type="button"
          onClick={() => onChangeViewMode('horizontal')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
            viewMode === 'horizontal'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="가로 슬라이드 형태로 페이지네이션하여 보는 뷰 (1P/2P 옵션)"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>가로 페이징</span>
        </button>

        {/* 모드 3: 순수 에디터 모드 (Tiptap 본문 집중) */}
        <button
          type="button"
          onClick={() => onChangeViewMode('pure-editor')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
            viewMode === 'pure-editor'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="A4 규격 테두리 없이 자유롭게 작성하는 순수 Tiptap 에디터 모드"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>순수 에디터</span>
        </button>

        {/* 모드 4: 그리드 조망 모드 (3~4페이지 한 행 조망) */}
        <button
          type="button"
          onClick={() => onChangeViewMode('grid')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="한 row에 3~4페이지를 바둑판 형태로 배치하여 전체 문서를 조망하는 뷰"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>그리드 조망</span>
        </button>
      </div>

      {/* 2. 모드별 서브 컨트롤러 (인라인 확장) */}
      {viewMode === 'horizontal' && (
        <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shrink-0">
          {/* 이전 페이지 버튼 */}
          <button
            type="button"
            disabled={horizontalPage <= 1}
            onClick={() => onChangeHorizontalPage(Math.max(1, horizontalPage - horizontalSpread))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="이전 페이지"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* 현재 페이지 번호 표시 */}
          <span className="font-mono text-slate-200 px-1 font-semibold">
            {horizontalSpread === 2 && horizontalPage + 1 <= totalHorizontalPages
              ? `P.${horizontalPage}-${horizontalPage + 1}`
              : `P.${horizontalPage}`}{' '}
            <span className="text-slate-500 font-normal">/ {totalHorizontalPages}P</span>
          </span>

          {/* 다음 페이지 버튼 */}
          <button
            type="button"
            disabled={horizontalPage + (horizontalSpread - 1) >= totalHorizontalPages}
            onClick={() => onChangeHorizontalPage(Math.min(totalHorizontalPages, horizontalPage + horizontalSpread))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="다음 페이지"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-slate-800 mx-1" />

          {/* 단면(1P) / 양면(2P) 스프레드 토글 */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => onChangeHorizontalSpread(1)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                horizontalSpread === 1 ? 'bg-indigo-950 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="한 화면에 1페이지만 보기"
            >
              <FileText className="w-3 h-3" />
              <span>1P</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeHorizontalSpread(2)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                horizontalSpread === 2 ? 'bg-indigo-950 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="한 화면에 2페이지 양면(스프레드)으로 보기"
            >
              <BookOpen className="w-3 h-3" />
              <span>2P 양면</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="flex items-center gap-2 bg-slate-950/90 px-2.5 py-0.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 animate-in fade-in duration-150">
          {/* 한 Row당 컬럼 수 (2열, 3열, 4열) */}
          <span className="text-[10px] text-slate-400 font-medium">열 수:</span>
          <div className="flex items-center gap-0.5 bg-slate-900 rounded p-0.5 border border-slate-800">
            {([2, 3, 4] as const).map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => onChangeGridCols(cols)}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer font-mono ${
                  gridCols === cols ? 'bg-indigo-950 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`한 행에 ${cols}페이지씩 배치`}
              >
                {cols}열
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-slate-800 mx-1" />

          {/* 크기 조절 슬라이더 및 배율 */}
          <span className="text-[10px] text-slate-400 font-medium">크기:</span>
          <input
            type="range"
            min="0.35"
            max="0.85"
            step="0.05"
            value={gridScale}
            onChange={(e) => onChangeGridScale(parseFloat(e.target.value))}
            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title={`줌 배율: ${Math.round(gridScale * 100)}%`}
          />
          <span className="font-mono text-[10px] text-slate-300 w-7 text-right">
            {Math.round(gridScale * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
