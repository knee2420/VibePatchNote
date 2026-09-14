import { useState, useCallback, useMemo, useRef, memo } from 'react';
import { Document } from 'react-pdf';
import { Loader2, AlertCircle } from 'lucide-react';

// 워커 설정은 이 모듈 import 만으로 1회 수행됩니다. (SSOT: pdfWorkerSetup.ts)
import './pdfWorkerSetup';
import { INTERNAL_COORDINATE_SCALE, toHostBox, toInternalBox } from '../../coordinates';
import { resolveViewerLabels } from '../../labels';
import type { DocumentViewerProps, ViewerHighlight, ViewerSegment } from '../../types';
import { ViewerConfigProvider } from '../../viewerConfig';
import { PdfPage } from './PdfPage';
import { usePdfTextLines, type PdfPageInfo } from './usePdfTextLines';

export const PdfViewer = memo(function PdfViewer({
  url,
  isSpread = false,
  segments = [],
  selectedSegmentId,
  mergeCandidateIds,
  absorbedSegmentIds,
  mergePreviewBox,
  onToggleMergeCandidate,
  segmentTypes,
  highlights,
  isEditMode = false,
  enableSmartSnap = true,
  coordinateScale = INTERNAL_COORDINATE_SCALE,
  labels: labelOverrides,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onSplitSegment,
  onSelectSegment,
  onPageCountChange,
  onDimensionsChange,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { textLinesByPage, collectTextLines } = usePdfTextLines();
  const labels = resolveViewerLabels(labelOverrides);

  // **좌표 스케일은 경계에서 한 번만 환산한다.** 내부 기하·스냅·리사이즈는 전부
  // 0~1000 가정 위에 있으므로, 호스트 스케일을 계산식마다 끌고 다니지 않는다.
  const internalSegments = useMemo<ViewerSegment[]>(
    () =>
      coordinateScale === INTERNAL_COORDINATE_SCALE
        ? segments
        : segments.map((segment) => ({ ...segment, box: toInternalBox(segment.box, coordinateScale) })),
    [segments, coordinateScale]
  );

  const internalHighlights = useMemo<ViewerHighlight[]>(() => {
    if (!highlights?.length) return [];
    if (coordinateScale === INTERNAL_COORDINATE_SCALE) return highlights;
    return highlights.map((item) => ({ ...item, box: toInternalBox(item.box, coordinateScale) }));
  }, [highlights, coordinateScale]);

  const internalMergePreviewBox = useMemo(() => {
    if (!mergePreviewBox) return null;
    return coordinateScale === INTERNAL_COORDINATE_SCALE
      ? mergePreviewBox
      : toInternalBox(mergePreviewBox, coordinateScale);
  }, [mergePreviewBox, coordinateScale]);

  const toHostSegment = useCallback(
    (segment: ViewerSegment): ViewerSegment =>
      coordinateScale === INTERNAL_COORDINATE_SCALE
        ? segment
        : { ...segment, box: toHostBox(segment.box, coordinateScale) },
    [coordinateScale]
  );

  const handleUpdateSegment = useCallback(
    (updated: ViewerSegment) => onUpdateSegment?.(toHostSegment(updated)),
    [onUpdateSegment, toHostSegment]
  );
  const handleCreateSegment = useCallback(
    (created: ViewerSegment) => onCreateSegment?.(toHostSegment(created)),
    [onCreateSegment, toHostSegment]
  );
  const handleSelectSegment = useCallback(
    (selected: ViewerSegment) => onSelectSegment?.(toHostSegment(selected)),
    [onSelectSegment, toHostSegment]
  );

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages);
      setLoadError(null);
      onPageCountChange?.(pages);
    },
    [onPageCountChange]
  );

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('Failed to load PDF:', error);
    setLoadError(labels.pdfLoadError);
  }, []);

  const handlePageLoadSuccess = useCallback(
    (page: PdfPageInfo, pageNumber: number) => {
      if (pageNumber === 1) {
        onDimensionsChange?.({
          width: page.width,
          height: page.height,
          aspectRatio: page.width / page.height,
        });
      }
      collectTextLines(page, pageNumber);
    },
    [onDimensionsChange, collectTextLines]
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-rose-500 bg-rose-50/50 rounded-b-md">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-xs font-medium">{loadError}</p>
      </div>
    );
  }

  return (
    <ViewerConfigProvider labels={labelOverrides} segmentTypes={segmentTypes}>
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-100/70 rounded-b-md">
        <Document
        file={url}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleDocumentLoadError}
        loading={
          <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">{labels.pdfLoading}</span>
          </div>
        }
        className="flex-1 flex overflow-hidden"
      >
        {numPages && (
          <div
            ref={scrollContainerRef}
            className={`w-full h-full ${
              isSpread
                ? 'px-4 pt-3 pb-1.5 flex flex-row items-start gap-5 overflow-x-auto overflow-y-hidden scrollbar-thin'
                : 'p-4 flex flex-col items-center gap-6 overflow-y-auto overflow-x-hidden scrollbar-thin'
            }`}
          >
            {Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <PdfPage
                  key={`page_${pageNumber}`}
                  pageNumber={pageNumber}
                  totalPages={numPages}
                  isSpread={isSpread}
                  segments={internalSegments}
                  selectedSegmentId={selectedSegmentId}
                  mergeCandidateIds={mergeCandidateIds}
                  absorbedSegmentIds={absorbedSegmentIds}
                  mergePreviewBox={internalMergePreviewBox}
                  onToggleMergeCandidate={onToggleMergeCandidate}
                  highlights={internalHighlights}
                  textLines={textLinesByPage[pageNumber]}
                  isEditMode={isEditMode}
                  enableSnap={enableSmartSnap}
                  scrollContainerRef={scrollContainerRef}
                  onLoadSuccess={handlePageLoadSuccess}
                  onUpdateSegment={handleUpdateSegment}
                  onCreateSegment={handleCreateSegment}
                  onDeleteSegment={onDeleteSegment}
                  onSplitSegment={onSplitSegment}
                  onSelectSegment={handleSelectSegment}
                />
              );
            })}
          </div>
        )}
        </Document>
      </div>
    </ViewerConfigProvider>
  );
});

// react-pdf 의 Page 렌더 결과를 검사할 때 쓰는 최소 타입을 재수출합니다.
export type { PdfPageInfo };
