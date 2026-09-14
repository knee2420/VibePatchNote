/**
 * 참고 문서(원본 파일) 엔티티의 공개 경계.
 *
 * 카드 **조합**은 여기 없다. 카드는 참고 문서와 세그먼트라는 두 엔티티를 함께
 * 쓰므로 `widgets/reference-document-workbench` 가 소유한다 — 같은 레이어끼리
 * 참조하면 두 슬라이스가 함께 굳는다.
 */
export { REFERENCE_DOCUMENT_NODE_TYPE, REFERENCE_CARD_SIZE } from './model/types';
export type {
  ReferenceDocumentData,
  DocumentOutlineNode,
  DocumentElementItem,
  ExtractOutlineResponse,
  AnalysisError,
  DocumentAnalysisStatus,
} from './model/types';
export { referenceDocumentApi } from './api/referenceDocumentApi';
export type { UploadDocumentResponse, ScaffoldExtractResponse } from './api/referenceDocumentApi';
export { useDocumentScaffold } from './model/useDocumentScaffold';
export { useDocumentOutline } from './model/useDocumentOutline';
export { useDocumentLayout } from './lib/useDocumentLayout';
export { useNodeResize } from './lib/useNodeResize';
export { useNodeWheelScroll } from './lib/useNodeWheelScroll';
export { CardResizeFrame } from './ui/CardResizeFrame';
export { NodeSpreadAnchor } from './ui/NodeSpreadAnchor';
export { ReferenceCardHeader } from './ui/ReferenceCardHeader';
export { DocumentOutlinePanel } from './ui/DocumentOutlinePanel';
export { getReferenceCardTheme } from './ui/referenceCardTheme';
