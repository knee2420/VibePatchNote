import { useState, useCallback, memo } from 'react';
import { Document } from 'react-pdf';
import { Loader2, AlertCircle } from 'lucide-react';

// 워커 설정은 이 모듈 import 만으로 1회 수행됩니다. (SSOT: pdfWorkerSetup.ts)
import './pdfWorkerSetup';
import type { DocumentViewerProps } from '../../types';
import { PdfPage } from './PdfPage';
import { usePdfTextLines, type PdfPageInfo } from './usePdfTextLines';

export const PdfViewer = memo(function PdfViewer({
  url,
  isSpread = false,
  segments = [],
  isEditMode = false,
  enableSmartSnap = true,
  onUpdateSegment,
  onCreateSegment,
  onDeleteSegment,
  onPageCountChange,
  onDimensionsChange,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { textLinesByPage, collectTextLines } = usePdfTextLines();

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
    setLoadError('PDF 문서를 로드하지 못했습니다.');
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

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-rose-500 bg-rose-50/50 rounded-b-md">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-xs font-medium">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-100/70 rounded-b-md select-none">
      <Document
        file={url}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleDocumentLoadError}
        loading={
          <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">PDF 페이지 파싱 중...</span>
          </div>
        }
        className="flex-1 flex overflow-hidden"
      >
        {numPages && (
          <div
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
                  segments={segments}
                  textLines={textLinesByPage[pageNumber]}
                  isEditMode={isEditMode}
                  enableSnap={enableSmartSnap}
                  onLoadSuccess={handlePageLoadSuccess}
                  onUpdateSegment={onUpdateSegment}
                  onCreateSegment={onCreateSegment}
                  onDeleteSegment={onDeleteSegment}
                />
              );
            })}
          </div>
        )}
      </Document>
    </div>
  );
});

// react-pdf 의 Page 렌더 결과를 검사할 때 쓰는 최소 타입을 재수출합니다.
export type { PdfPageInfo };
