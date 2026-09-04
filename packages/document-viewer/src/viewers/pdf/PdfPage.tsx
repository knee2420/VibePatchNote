import { memo, useRef, useState, useEffect, type RefObject } from 'react';
import { Page } from 'react-pdf';
import { Loader2 } from 'lucide-react';

import type { ViewerSegment } from '../../types';
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
  textLines?: number[];
  isEditMode: boolean;
  enableSnap: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onLoadSuccess: (page: PdfPageInfo, pageNumber: number) => void;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
}

/** PDF 한 페이지 캔버스 + 그 위에 겹치는 세그먼트 오버레이 + 페이지 인디케이터. */
export const PdfPage = memo(function PdfPage({
  pageNumber,
  totalPages,
  isSpread,
  segments,
  textLines,
  isEditMode,
  enableSnap,
  scrollContainerRef,
  onLoadSuccess,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
}: PdfPageProps) {
  const width = isSpread ? SPREAD_PAGE_WIDTH : SINGLE_PAGE_WIDTH;
  const height = isSpread ? SPREAD_PAGE_HEIGHT : SINGLE_PAGE_HEIGHT;

  const containerRef = useRef<HTMLDivElement>(null);
  // 1페이지는 종횡비 계산 및 초기 로드를 위해 즉시 노출
  const [isVisible, setIsVisible] = useState(pageNumber === 1);

  useEffect(() => {
    if (pageNumber === 1) {
      setIsVisible(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const root = scrollContainerRef?.current ?? null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root,
        // 상하좌우 350px 여유를 두어 스크롤 시 부드럽게 사전 렌더링
        rootMargin: '350px',
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [scrollContainerRef, pageNumber, isSpread]);

  return (
    <div className="shrink-0 flex flex-col items-center group/page">
      {/* 좌표 오버레이가 정확히 겹치도록 relative 컨테이너로 감쌉니다. */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-md shadow-md border border-slate-200 overflow-visible transition-shadow group-hover/page:shadow-lg"
        style={{ width, minHeight: height }}
      >
        {isVisible ? (
          <>
            <Page
              pageNumber={pageNumber}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={(page) => onLoadSuccess(page, pageNumber)}
              loading={
                <div
                  className="bg-white flex items-center justify-center text-slate-300"
                  style={{ width, height }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              }
            />

            <PdfSegmentOverlay
              pageNumber={pageNumber}
              segments={segments}
              textLines={textLines}
              isEditMode={isEditMode}
              enableSnap={enableSnap}
              onUpdateSegment={onUpdateSegment}
              onCreateSegment={onCreateSegment}
              onDeleteSegment={onDeleteSegment}
            />
          </>
        ) : (
          <div
            className="bg-slate-50/70 flex flex-col items-center justify-center text-slate-400 gap-2 select-none"
            style={{ width, height }}
          >
            <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-500 shadow-2xs">
              {pageNumber}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">스크롤 시 자동 로드</span>
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
