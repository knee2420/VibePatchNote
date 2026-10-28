/**
 * 화면 문구는 **호스트가 정한다.**
 *
 * 예전에는 이 패키지가 한국어 문자열을 직접 들고 있었다. 그러면 "파일만 복사하고
 * Props 만 넘기면 동작한다"가 성립하지 않는다 — 다른 로케일의 앱은 패키지 소스를
 * 고쳐야 했다. 기본값은 중립적인 영어로 두고, 호스트가 필요한 것만 덮어쓴다.
 */
export interface ViewerLabels {
  pdfLoadError: string;
  pdfLoading: string;
  imageLoadError: string;
  imageLoading: string;
  lazyPageHint: string;
  creatingSegment: string;
  mergePreview: string;
  newSegmentLabel: string;
  editLabelAndType: string;
  deleteSegment: string;
  splitHorizontal: string;
  splitVertical: string;
  clearSelection: string;
  labelPlaceholder: string;
  saveLabel: string;
  resizeTopLeft: string;
  resizeTopRight: string;
  resizeBottomRight: string;
  resizeBottomLeft: string;
  resizeTop: string;
  resizeBottom: string;
  resizeLeft: string;
  resizeRight: string;
}

export const defaultViewerLabels: ViewerLabels = {
  pdfLoadError: 'Failed to load the PDF document.',
  pdfLoading: 'Parsing PDF pages…',
  imageLoadError: 'Failed to load the image.',
  imageLoading: 'Loading image…',
  lazyPageHint: 'Loads on scroll',
  creatingSegment: 'Drawing a new region',
  mergePreview: 'Merged area',
  newSegmentLabel: 'New region',
  editLabelAndType: 'Edit label and type (double-click)',
  deleteSegment: 'Delete segment (Del)',
  splitHorizontal: 'Split horizontally',
  splitVertical: 'Split vertically',
  clearSelection: 'Clear selection (Esc)',
  labelPlaceholder: 'Enter a label…',
  saveLabel: 'Save (Enter)',
  resizeTopLeft: 'Resize (top-left)',
  resizeTopRight: 'Resize (top-right)',
  resizeBottomRight: 'Resize (bottom-right)',
  resizeBottomLeft: 'Resize (bottom-left)',
  resizeTop: 'Resize top edge',
  resizeBottom: 'Resize bottom edge',
  resizeLeft: 'Resize left edge',
  resizeRight: 'Resize right edge',
};

/** 호스트가 넘긴 일부 문구를 기본값 위에 얹는다. */
export function resolveViewerLabels(partial?: Partial<ViewerLabels>): ViewerLabels {
  return partial ? { ...defaultViewerLabels, ...partial } : defaultViewerLabels;
}
