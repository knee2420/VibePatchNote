import type { PagedCanvasContainerProps } from './types';

/**
 * 선택된 뷰 레이아웃 모드(연속 스크롤, A4 낱장, 양면 스프레드, 젠 모드)와
 * 줌 배율(Zoom Scale)에 맞춰 자식 에디터 캔버스를 감싸는 반응형 컨테이너 컴포넌트.
 */
export function PagedCanvasContainer({
  layoutMode,
  zoom = 100,
  currentPage = 1,
  totalPages = 1,
  children,
  className = '',
}: PagedCanvasContainerProps) {
  const zoomScale = zoom / 100;

  // 1. 연속 스크롤 뷰 (웹 레이아웃)
  if (layoutMode === 'continuous') {
    return (
      <div className={`w-full h-full overflow-auto p-6 flex flex-col items-center select-text bg-slate-100/70 ${className}`}>
        <div
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-4xl flex flex-col items-center"
        >
          {children}
        </div>
      </div>
    );
  }

  // 2. A4 낱장 분할 인쇄 뷰
  if (layoutMode === 'paged') {
    return (
      <div className={`w-full h-full overflow-auto p-8 flex flex-col items-center bg-slate-100/70 select-text ${className}`}>
        <div
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="flex flex-col items-center gap-8"
        >
          {/* A4 용지 프레임 */}
          <div className="w-[210mm] min-h-[297mm] bg-white rounded-xs shadow-md border border-slate-200/80 p-[20mm] flex flex-col justify-between text-slate-900 relative">
            {/* 상단 헤더 여백 */}
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pb-4 border-b border-slate-100 mb-6 font-sans select-none">
              <span>A4 규격 인쇄 레이아웃</span>
              <span>페이지 {currentPage}</span>
            </div>

            {/* 본문 콘텐츠 슬롯 */}
            <div className="flex-1 w-full overflow-visible">
              {children}
            </div>

            {/* 하단 푸터 페이지 넘버링 */}
            <div className="w-full pt-4 border-t border-slate-100 mt-6 flex items-center justify-center text-xs font-mono text-slate-400 select-none">
              - {currentPage} / {Math.max(1, totalPages)} -
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. 2쪽 나란히 보기 (양면 스프레드)
  if (layoutMode === 'spread') {
    return (
      <div className={`w-full h-full overflow-auto p-8 flex flex-col items-center bg-slate-100/70 select-text ${className}`}>
        <div
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="flex flex-row gap-6 max-w-7xl justify-center items-start"
        >
          {/* 좌측 면 (Left Page) */}
          <div className="w-[180mm] min-h-[260mm] bg-white rounded-xs shadow-md border border-slate-200/80 p-[16mm] flex flex-col justify-between text-slate-900">
            <div className="text-[10px] text-slate-400 pb-3 border-b border-slate-100 font-sans select-none">
              좌면 (Page {currentPage})
            </div>
            <div className="flex-1 w-full my-4 overflow-visible">
              {children}
            </div>
            <div className="text-center text-xs font-mono text-slate-400 border-t border-slate-100 pt-3 select-none">
              {currentPage}
            </div>
          </div>

          {/* 우측 면 (Right Page) */}
          <div className="w-[180mm] min-h-[260mm] bg-white rounded-xs shadow-md border border-slate-200/80 p-[16mm] flex flex-col justify-between text-slate-900">
            <div className="text-[10px] text-slate-400 pb-3 border-b border-slate-100 text-right font-sans select-none">
              우면 (Page {currentPage + 1})
            </div>
            <div className="flex-1 w-full my-4 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg p-6 select-none">
              {currentPage + 1 <= totalPages ? children : <span>(여백 페이지)</span>}
            </div>
            <div className="text-center text-xs font-mono text-slate-400 border-t border-slate-100 pt-3 select-none">
              {currentPage + 1}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. 집중/젠 모드 (Zen Mode)
  return (
    <div className={`w-full h-full overflow-auto p-12 flex flex-col items-center bg-slate-50 select-text ${className}`}>
      <div
        style={{
          transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full max-w-3xl flex flex-col items-center shadow-lg bg-white rounded-xl p-8 border border-slate-200/80"
      >
        {children}
      </div>
    </div>
  );
}
