import { useState, useCallback, memo } from 'react';
import { Document, Page } from 'react-pdf';
import { Loader2, AlertCircle } from 'lucide-react';

import './pdfWorkerSetup';
import type { DocumentViewerProps } from '../../types';

export const PdfViewer = memo(function PdfViewer({
  url,
  isSpread = false,
  onPageCountChange,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
                <div
                  key={`page_${pageNumber}`}
                  className="shrink-0 flex flex-col items-center group/page"
                >
                  {/* Page Canvas Container */}
                  <div className="bg-white rounded-md shadow-md border border-slate-200 overflow-hidden transition-shadow group-hover/page:shadow-lg">
                    <Page
                      pageNumber={pageNumber}
                      width={isSpread ? 380 : 520}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div
                          className="bg-white flex items-center justify-center text-slate-300"
                          style={{
                            width: isSpread ? 380 : 520,
                            height: isSpread ? 530 : 730,
                          }}
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      }
                    />
                  </div>

                  {/* Page Indicator Badge */}
                  {numPages > 1 && (
                    <div className={`${isSpread ? 'mt-1.5' : 'mt-2'} px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-medium tracking-wider shadow-2xs`}>
                      {pageNumber} / {numPages}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Document>
    </div>
  );
});
