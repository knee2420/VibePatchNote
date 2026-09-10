import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const REFERENCE_DOCUMENT_NODE_TYPE = 'referenceDocument';

/**
 * 참고 문서 카드의 기본 크기(px).
 * 카드 자신의 레이아웃 계산과 캔버스 정렬 계산이 같은 값을 봐야 하므로 여기가 단일 출처입니다.
 */
export const REFERENCE_CARD_SIZE = { width: 600, height: 800 } as const;

export interface DocumentSegmentItem {
  id: string;
  page: number;
  type: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  content_summary?: string;
}

export interface ScanDocumentResponse {
  status: string;
  docId: string;
  document_title: string;
  total_segments: number;
  segments: DocumentSegmentItem[];
  agentRunId?: string;
}

export interface DocumentElementItem {
  id: string;
  outline_id?: string;
  type: string; // 'table' | 'form_field' | 'list' | 'paragraph' | 'media'
  label: string;
  page: number;
  box_2d: [number, number, number, number];
  content_summary?: string;
  structured_data?: Record<string, unknown>;
}

export interface DocumentOutlineNode {
  id: string;
  level: number;
  title: string;
  page: number;
  box_2d?: [number, number, number, number];
  purpose?: string;
  elements: DocumentElementItem[];
  children: DocumentOutlineNode[];
}

/** 실패를 사용자에게 안전하게 표현하기 위한 계약. 백엔드 `AnalysisError` 와 1:1. */
export interface AnalysisError {
  code: string;
  message: string;
  retryable?: boolean;
  requiresAction?: string;
}

/**
 * 분석 실행 상태. 백엔드 Agent Runtime 의 6상태를 그대로 따릅니다.
 *
 * `waiting_*` 은 **실패가 아니라 보류**입니다. 이 둘을 실패로 그리면 사용자는
 * 풀리지 않는 재시도만 반복하게 됩니다.
 */
export type DocumentAnalysisStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting_for_configuration'
  | 'waiting_for_approval';

export interface ExtractOutlineResponse {
  status: string;
  docId: string;
  document_title: string;
  total_pages: number;
  total_outlines: number;
  total_elements: number;
  outlines: DocumentOutlineNode[];
  elements: DocumentElementItem[];
  markdown_outline: string;
  manifest?: Record<string, unknown>;
  artifactId?: string | null;
  traceId?: string;
  agentRunId?: string;
  error?: AnalysisError;
}

/**
 * 캔버스 노드가 들고 다니는 참고 문서 데이터.
 *
 * **파생물은 여기에 두지 않습니다.** `outlines` / `elements` / `segments` 는 각각
 * 백엔드 아티팩트 저장소가 정본을 갖고 있고, 노드는 `docId` 포인터만 들면 됩니다.
 * 사본을 남기면 재분석했을 때 노드·세션·아티팩트 세 곳이 갈라지고, 세션 파일이
 * 수백 KB 로 부풉니다(실제로 349KB 까지 자랐습니다).
 *
 * 대신 **마지막 성공과 방금 실패를 구분할 수 있는 상태**를 들고 있습니다.
 */
export interface ReferenceDocumentData extends Record<string, unknown> {
  /** 문서 식별자. 모든 파생 데이터는 이 포인터로 조회합니다. */
  docId?: string;
  title: string;
  url: string;
  fileType?: string; // 'pdf' | 'text' | 'image' | 'default' 등
  size?: number;
  theme?: NodeTheme;
  isOutlineOpen?: boolean;
  /** 마지막 아웃라인 분석의 실행 상태. */
  outlineStatus?: DocumentAnalysisStatus;
  outlineError?: AnalysisError;
  outlineTraceId?: string;
  outlineRunId?: string;
  /** 마지막으로 성공한 분석 시각. 실패 이력과 혼동하지 않기 위해 따로 둡니다. */
  lastSuccessfulOutlineAt?: string;
}
