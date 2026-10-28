import { memo, useRef, useState, useEffect, type RefObject } from 'react';
import { Page } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// 텍스트 레이어를 켜는 쪽이 그 스타일도 가져온다. 이 CSS 가 없으면 react-pdf 가
// 매 페이지마다 경고를 찍고, 위치가 잡히지 않은 텍스트 span 이 캔버스 위에 그대로
// 겹쳐 보인다. 주석 레이어는 끄고 있으므로(renderAnnotationLayer={false})
// AnnotationLayer.css 는 가져오지 않는다.
import 'react-pdf/dist/Page/TextLayer.css';

import type { SegmentBoxTuple, ViewerHighlight, ViewerSegment } from '../../types';
import { useViewerLabels } from '../../viewerConfig';
import { PdfHighlightOverlay } from './PdfHighlightOverlay';
import { PdfSegmentOverlay } from './PdfSegmentOverlay';
import type { PdfPageInfo } from './usePdfTextLines';

const SPREAD_PAGE_WIDTH = 380;
const SINGLE_PAGE_WIDTH = 520;
const SPREAD_PAGE_HEIGHT = 530;
const SINGLE_PAGE_HEIGHT = 730;

interface PdfPageProps {
  pageNumber: number;
  totalPages: number;
  isSpread: boolean;
  segments: ViewerSegment[];
  selectedSegmentId?: string | null;
  mergeCandidateIds?: string[];
  absorbedSegmentIds?: string[];
  mergePreviewBox?: SegmentBoxTuple | null;
  onToggleMergeCandidate?: (segmentId: string) => void;
  highlights?: ViewerHighlight[];
  textLines?: number[];
  isEditMode: boolean;
  enableSnap: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onLoadSuccess: (page: PdfPageInfo, pageNumber: number) => void;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onSplitSegment?: (segmentId: string, axis: 'horizontal' | 'vertical') => void;
  onSelectSegment?: (segment: ViewerSegment) => void;
}

/** PDF 한 페이지 캔버스 + 그 위에 겹치는 세그먼트 오버레이 + 페이지 인디케이터. */
export const PdfPage = memo(function PdfPage({
  pageNumber,
  totalPages,
  isSpread,
  segments,
  selectedSegmentId,
  mergeCandidateIds,
  absorbedSegmentIds,
  mergePreviewBox,
  onToggleMergeCandidate,
  highlights,
  textLines,
  isEditMode,
  enableSnap,
  scrollContainerRef,
  onLoadSuccess,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onSplitSegment,
  onSelectSegment,
}: PdfPageProps) {
  const labels = useViewerLabels();
  const width = isSpread ? SPREAD_PAGE_WIDTH : SINGLE_PAGE_WIDTH;
  const height = isSpread ? SPREAD_PAGE_HEIGHT : SINGLE_PAGE_HEIGHT;

  const containerRef = useRef<HTMLDivElement>(null);
  const [renderWidth, setRenderWidth] = useState(width);
  // 1페이지는 즉시 렌더링, 그 외 페이지는 최초 시야 진입 시 렌더링 시작 후 영구 유지 (화면 이동 시 언마운트-리마운트 루프 방지)
  const [hasRendered, setHasRendered] = useState(pageNumber === 1);

  useEffect(() => {
    if (pageNumber === 1 || hasRendered) return;

    const element = containerRef.current;
    if (!element) return;

    const root = scrollContainerRef?.current ?? null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRendered(true);
        }
      },
      {
        root,
        // 상하좌우 400px 여유를 두어 스크롤/팬 시 부드럽게 사전 렌더링
        rootMargin: '400px',
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [scrollContainerRef, pageNumber, hasRendered, isSpread]);

  useEffect(() => {
    const parent = scrollContainerRef?.current ?? containerRef.current?.parentElement;
    if (!parent || isSpread) {
      setRenderWidth(width);
      return;
    }
    const update = () => {
      const nextWidth = Math.round(Math.max(280, Math.min(width, parent.clientWidth - 32)));
      setRenderWidth((prev) => (Math.abs(prev - nextWidth) >= 4 ? nextWidth : prev));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [isSpread, width, scrollContainerRef]);

  const placeholderHeight = (renderWidth * height) / width;

  return (
    <div className="shrink-0 flex flex-col items-center group/page">
      {/* 좌표 오버레이가 정확히 겹치도록 relative 컨테이너로 감쌉니다. */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-md shadow-md border border-slate-200 overflow-visible transition-shadow group-hover/page:shadow-lg"
        style={{ width: renderWidth, minHeight: placeholderHeight }}
      >
        {hasRendered ? (
          <>
            <Page
              pageNumber={pageNumber}
              width={renderWidth}
              renderTextLayer={!isEditMode}
              renderAnnotationLayer={false}
              onLoadSuccess={(page) => onLoadSuccess(page, pageNumber)}
              onLoadError={(err) => {
                if (err?.message?.includes('Worker was terminated')) return;
                console.error(`Page ${pageNumber} load error:`, err);
              }}
              onRenderError={(err) => {
                if (err?.message?.includes('Worker was terminated')) return;
                console.error(`Page ${pageNumber} render error:`, err);
              }}
              loading={
                <div
                  className="bg-white flex items-center justify-center text-slate-300"
                  style={{ width: renderWidth, height: placeholderHeight }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              }
            />

            <PdfSegmentOverlay
              pageNumber={pageNumber}
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              mergeCandidateIds={mergeCandidateIds}
              absorbedSegmentIds={absorbedSegmentIds}
              mergePreviewBox={mergePreviewBox}
              onToggleMergeCandidate={onToggleMergeCandidate}
              textLines={textLines}
              isEditMode={isEditMode}
              enableSnap={enableSnap}
              onUpdateSegment={onUpdateSegment}
              onCreateSegment={onCreateSegment}
              onDeleteSegment={onDeleteSegment}
              onSplitSegment={onSplitSegment}
              onSelectSegment={onSelectSegment}
            />

            <PdfHighlightOverlay pageNumber={pageNumber} highlights={highlights} />
          </>
        ) : (
          <div
            className="bg-slate-50/70 flex flex-col items-center justify-center text-slate-400 gap-2 select-none"
            style={{ width: renderWidth, height: placeholderHeight }}
          >
            <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-500 shadow-2xs">
              {pageNumber}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{labels.lazyPageHint}</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div
          className={`${
            isSpread ? 'mt-1.5' : 'mt-2'
          } px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-medium tracking-wider shadow-2xs`}
        >
          {pageNumber} / {totalPages}
        </div>
      )}
    </div>
  );
});
