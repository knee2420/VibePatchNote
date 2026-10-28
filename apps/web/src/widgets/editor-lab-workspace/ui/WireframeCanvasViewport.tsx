import { useMemo, useRef, useState, useEffect } from 'react';
import { Layers, FileText } from 'lucide-react';
import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';
import { extractAllPages, extractPageHtml } from '../lib/scaffoldPageUtils';
import { DocumentPageCard } from './DocumentPageCard';
import type { EditorTabItem, WireframeViewMode } from '../model/types';

export interface WireframeCanvasViewportProps {
  activeTab: EditorTabItem;
  scaffoldId?: string;
  liveHtml?: string;
  onWireframeChangeHtml?: (html: string) => void;
  onPageWireframeChangeHtml?: (pageNumber: number, html: string) => void;
  onWireframeChangeMarkdown?: (md: string) => void;
  onContentChange: (val: string) => void;

  // 4가지 뷰 모드 설정
  viewMode: WireframeViewMode;
  horizontalPage: number;
  horizontalSpread: 1 | 2;
  gridCols: 2 | 3 | 4;
  gridScale: number;
  onSelectPage?: (pageNumber: number) => void;
  selectedSlotId?: string | null;
  selectedSlotNumber?: number | null;
  onSlotClick?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;
  onJumpToSourceAnchor?: (slotId: string) => void;
  onAcceptSlotSuggestion?: (slotId: string) => void;
  slotBindings?: Record<string, any>;
  onSelectSlotsChange?: (slotIds: string[]) => void;
}

export function WireframeCanvasViewport({
  activeTab,
  scaffoldId,
  liveHtml = '',
  onWireframeChangeHtml,
  onPageWireframeChangeHtml,
  onWireframeChangeMarkdown,
  onContentChange,
  viewMode,
  horizontalPage,
  horizontalSpread,
  gridCols,
  gridScale,
  onSelectPage,
  selectedSlotId,
  selectedSlotNumber,
  onSlotClick,
  onBindSlot,
  onJumpToSourceAnchor,
  onAcceptSlotSuggestion,
  slotBindings,
  onSelectSlotsChange,
}: WireframeCanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // 컨테이너 가로폭 실시간 감지 (ResizeObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    setContainerWidth(el.clientWidth || 800);

    return () => observer.disconnect();
  }, []);

  // 전체 문서에서 추출된 모든 개별 페이지 목록
  const allPages = useMemo(() => {
    return extractAllPages(liveHtml || activeTab.content || '');
  }, [liveHtml, activeTab.content]);

  // 페이지 단위 HTML 변경 핸들러
  const handlePageChange = (pageNum: number, newHtml: string) => {
    onPageWireframeChangeHtml?.(pageNum, newHtml);
  };

  // ---------------- 1. 순수 에디터 모드 (Pure Tiptap Editor) ---------------- //
  if (viewMode === 'pure-editor') {
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-8 px-6 flex justify-center items-start bg-slate-950"
      >
        <div className="w-full max-w-3xl bg-slate-900 text-slate-100 rounded-xl shadow-xl p-8 border border-slate-800/80 min-h-[850px]">
          <div className="mb-4 pb-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>순수 Tiptap 에디터 모드 (A4 박스 제약 없음)</span>
            </span>
            <span className="text-[11px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50">
              실시간 동기화 SSOT
            </span>
          </div>
          <ScaffoldCanvasEditor
            key={`pure-editor-${activeTab.scaffoldId || scaffoldId}`}
            initialContent={liveHtml || activeTab.content || ''}
            onChangeHtml={(html) => (onWireframeChangeHtml || onContentChange)(html)}
            onChangeMarkdown={onWireframeChangeMarkdown}
          />
        </div>
      </div>
    );
  }

  // ---------------- 2. 가로 페이징 뷰 (Horizontal Paginated / Spread) ---------------- //
  if (viewMode === 'horizontal') {
    const leftPageNum = horizontalPage;
    const rightPageNum = horizontalSpread === 2 ? horizontalPage + 1 : null;
    const hasRightPage = rightPageNum !== null && rightPageNum <= allPages.length;

    // 2P 양면 스프레드일 때의 전용 스케일 계산 (두 페이지가 가로로 쏙 들어가도록)
    const spreadScale =
      horizontalSpread === 2
        ? Math.min(1.0, Math.max(0.35, (containerWidth - 72) / (595 * 2 + 24)))
        : undefined;

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto py-8 px-6 flex justify-center items-start bg-slate-900/60"
      >
        <div className="flex items-start justify-center gap-6 max-w-full">
          {/* 좌측 페이지 카드 (P.1 또는 단면) */}
          <DocumentPageCard
            pageNumber={leftPageNum}
            totalPages={allPages.length}
            pageHtml={extractPageHtml(liveHtml, leftPageNum)}
            documentKey={`${activeTab.scaffoldId || scaffoldId}-horiz`}
            containerWidth={horizontalSpread === 2 ? containerWidth / 2 : containerWidth}
            customScale={spreadScale}
            activeSlotId={selectedSlotId}
            activeMappingNumber={selectedSlotNumber}
            onSlotClick={onSlotClick}
            onBindSlot={onBindSlot}
            onJumpToSourceAnchor={onJumpToSourceAnchor}
            onAcceptSlotSuggestion={onAcceptSlotSuggestion}
            slotBindings={slotBindings}
            onChangeHtml={handlePageChange}
            onChangeMarkdown={onWireframeChangeMarkdown}
            onOpenSoloTab={onSelectPage}
            onSelectSlotsChange={onSelectSlotsChange}
          />

          {/* 우측 페이지 카드 (양면 스프레드 시) */}
          {horizontalSpread === 2 && (
            hasRightPage ? (
              <DocumentPageCard
                pageNumber={rightPageNum}
                totalPages={allPages.length}
                pageHtml={extractPageHtml(liveHtml, rightPageNum)}
                documentKey={`${activeTab.scaffoldId || scaffoldId}-horiz`}
                containerWidth={containerWidth / 2}
                customScale={spreadScale}
                activeSlotId={selectedSlotId}
                activeMappingNumber={selectedSlotNumber}
                onSlotClick={onSlotClick}
                onBindSlot={onBindSlot}
                onJumpToSourceAnchor={onJumpToSourceAnchor}
                onAcceptSlotSuggestion={onAcceptSlotSuggestion}
                slotBindings={slotBindings}
                onChangeHtml={handlePageChange}
                onChangeMarkdown={onWireframeChangeMarkdown}
                onOpenSoloTab={onSelectPage}
                onSelectSlotsChange={onSelectSlotsChange}
              />
            ) : (
              <div
                style={{
                  width: `${Math.round(595 * (spreadScale || 1))}px`,
                  minHeight: `${Math.round(842 * (spreadScale || 1))}px`,
                }}
                className="my-4 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/80 rounded-lg bg-slate-950/30 text-xs select-none"
              >
                <span>마지막 단면 페이지입니다 (우측 페이지 없음)</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // ---------------- 3. 그리드 조망 모드 (Grid Overview) ---------------- //
  if (viewMode === 'grid') {
    const gridColClass =
      gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4';

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-6 px-6 bg-slate-950 flex flex-col items-center"
      >
        <div className="w-full max-w-7xl mb-2 flex items-center justify-between px-2 text-xs text-slate-400 select-none">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>문서 전체 그리드 조망 ({allPages.length}개 페이지)</span>
          </span>
          <span className="text-[11px] text-slate-500">
            각 페이지의 '단독 탭 열기'를 클릭하여 개별 편집할 수 있습니다
          </span>
        </div>

        <div className={`grid ${gridColClass} gap-6 w-full max-w-7xl justify-items-center`}>
          {allPages.map(({ pageNumber, html }) => (
            <DocumentPageCard
              key={pageNumber}
              pageNumber={pageNumber}
              totalPages={allPages.length}
              pageHtml={html}
              documentKey={`grid-${activeTab.scaffoldId || scaffoldId}`}
              containerWidth={containerWidth / gridCols}
              customScale={gridScale}
              activeSlotId={selectedSlotId}
              activeMappingNumber={selectedSlotNumber}
              onSlotClick={onSlotClick}
              onBindSlot={onBindSlot}
              onJumpToSourceAnchor={onJumpToSourceAnchor}
              onAcceptSlotSuggestion={onAcceptSlotSuggestion}
              slotBindings={slotBindings}
              onChangeHtml={handlePageChange}
              onChangeMarkdown={onWireframeChangeMarkdown}
              onOpenSoloTab={onSelectPage}
              onSelectSlotsChange={onSelectSlotsChange}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---------------- 4. 세로 연속 뷰 (Vertical Continuous, 기본값) ---------------- //
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-6 px-4 flex flex-col items-center bg-slate-900/40"
    >
      {/* 만약 탭 자체가 '페이지 #N 단독 탭'이라면 해당 페이지만 1장 렌더링 */}
      {activeTab.pageNumber ? (
        <DocumentPageCard
          pageNumber={activeTab.pageNumber}
          totalPages={allPages.length}
          pageHtml={extractPageHtml(liveHtml, activeTab.pageNumber)}
          documentKey={`${activeTab.scaffoldId || scaffoldId}-solo`}
          containerWidth={containerWidth}
          activeSlotId={selectedSlotId}
          activeMappingNumber={selectedSlotNumber}
          onSlotClick={onSlotClick}
          onBindSlot={onBindSlot}
          onJumpToSourceAnchor={onJumpToSourceAnchor}
          onAcceptSlotSuggestion={onAcceptSlotSuggestion}
          slotBindings={slotBindings}
          onChangeHtml={handlePageChange}
          onChangeMarkdown={onWireframeChangeMarkdown}
          onSelectSlotsChange={onSelectSlotsChange}
        />
      ) : (
        /* 전체 페이지 탭인 경우: 모든 페이지를 독립 카드로 세로 정렬 (Auto-Fit) */
        <div className="flex flex-col items-center gap-6">
          {allPages.map(({ pageNumber, html }) => (
            <DocumentPageCard
              key={pageNumber}
              pageNumber={pageNumber}
              totalPages={allPages.length}
              pageHtml={html}
              documentKey={`${activeTab.scaffoldId || scaffoldId}-full`}
              containerWidth={containerWidth}
              activeSlotId={selectedSlotId}
              activeMappingNumber={selectedSlotNumber}
              onSlotClick={onSlotClick}
              onBindSlot={onBindSlot}
              onJumpToSourceAnchor={onJumpToSourceAnchor}
              onAcceptSlotSuggestion={onAcceptSlotSuggestion}
              slotBindings={slotBindings}
              onChangeHtml={handlePageChange}
              onChangeMarkdown={onWireframeChangeMarkdown}
              onOpenSoloTab={onSelectPage}
              onSelectSlotsChange={onSelectSlotsChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
