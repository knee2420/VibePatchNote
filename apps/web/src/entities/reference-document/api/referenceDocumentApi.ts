import { httpClient } from '@/shared/api';

import type {
  DocumentSegmentItem,
  ExtractOutlineResponse,
  ScanDocumentResponse,
} from '../model/types';

const BASE_PATH = '/api/v1/documents';

/** `POST /api/v1/documents/upload` 응답. 백엔드 `UploadResponse` 스키마와 1:1 대응합니다. */
export interface UploadDocumentResponse {
  status: string;
  docId: string;
  message: string;
  title: string;
  file_url: string;
}

export interface ScaffoldArchiveMeta {
  scaffoldId: string;
  docId?: string;
  title: string;
  sourcePdfFileName: string;
  createdAt: string;
  slotsCount: number;
  difficulty: string;
  /** 엔진이 부여한 원본 식별자와 판정 메타. 아카이브가 함께 보존한다. */
  engineScaffoldId?: string;
  targetDoc?: string;
  description?: string;
  /** 아카이빙된 원본 페이지 번호(1-based). */
  pageNumber?: number;
  overlayImageUrl: string;
  originalImageUrl: string;
  promptSpecUrl: string;
  htmlUrl: string;
  /** 엔진 원문 마크다운(content.md) URL. 명세서(promptSpecUrl)와 다른 파일이다. */
  markdownUrl: string;
  slotsUrl: string;
  archiveDir: string;
}

/** 산출물 한 건을 만든 조건. 모델·프롬프트를 바꿨을 때 결과 차이의 원인을 짚는 근거. */
export interface ArtifactProvenance {
  artifactId: string;
  kind: string;
  docId: string;
  createdAt: string;
  status: string;
  runId?: string | null;
  traceId?: string | null;
  model?: string;
  promptHash?: string | null;
  engineVersion?: string | null;
  summary?: Record<string, unknown>;
}

export interface DocumentArtifacts {
  docId: string;
  title: string;
  artifacts: Record<string, { head: string | null; versions: ArtifactProvenance[] }>;
}

/** `POST /api/v1/documents/scaffold` 응답 스키마. */
export interface ScaffoldExtractResponse {
  status: string;
  docId: string;
  meta: {
    id: string;
    title: string;
    targetDoc: string;
    sourcePdfFileName: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  htmlContent: string;
  markdownContent: string;
  slots?: Array<{
    id: string;
    number: number;
    label: string;
    box_2d: [number, number, number, number];
    pageNumber?: number;
  }>;
  archive?: ScaffoldArchiveMeta;
  agentRunId?: string;
}

/**
 * 참고 문서(reference-document) 도메인의 백엔드 API 통신 단일 진입점.
 *
 * 식별자는 `docId` 입니다. 파일명은 사람이 읽는 이름일 뿐이라 바뀔 수 있고,
 * 바뀌는 값을 키로 쓰면 이름을 고친 순간 다른 문서가 됩니다.
 *
 * **읽기와 실행이 나뉘어 있습니다.** `get*` 은 채택본을 읽기만 하고 LLM 을 부르지
 * 않습니다. 패널을 다시 열었다는 이유로 비용이 드는 분석이 다시 돌면 안 됩니다.
 */
export const referenceDocumentApi = {
  /** 참고 문서를 업로드하고 노드 생성에 필요한 메타를 돌려받습니다. */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.postFormData<UploadDocumentResponse>(`${BASE_PATH}/upload`, formData);
  },

  /** 문서와 그 문서에서 파생된 모든 것을 지웁니다. */
  remove: (docId: string) => httpClient.delete<void>(`${BASE_PATH}/${docId}`),

  /** 산출물 이력과 현재 채택본(HEAD). */
  getArtifacts: (docId: string) =>
    httpClient.get<DocumentArtifacts>(`${BASE_PATH}/${docId}/artifacts`),

  // --- 읽기 (LLM 미개입) ---

  /** 채택된 아웃라인을 읽습니다. 없으면 404. */
  getOutline: (docId: string) =>
    httpClient.get<ExtractOutlineResponse>(`${BASE_PATH}/${docId}/outline`),

  /** 채택된 세그먼트를 읽습니다. 아직 없으면 빈 목록을 받습니다. */
  getSegments: (docId: string) =>
    httpClient.get<ScanDocumentResponse>(`${BASE_PATH}/${docId}/segments`),

  /** 사용자가 손으로 고친 세그먼트를 새 아티팩트로 남깁니다. */
  saveSegments: (docId: string, segments: DocumentSegmentItem[]) =>
    httpClient.put<ScanDocumentResponse>(`${BASE_PATH}/${docId}/segments`, { segments }),

  // --- 실행 (Agent 경로) ---

  /** 문서 영역을 분석하여 표, 개조식 목록, 섹션 바운딩 박스를 추출합니다. */
  scanSegments: (docId: string) =>
    httpClient.post<ScanDocumentResponse>(`${BASE_PATH}/scan`, { docId }),

  /** 세그먼트 분석을 백그라운드 실행으로 접수합니다. */
  startSegmentScan: (docId: string) =>
    httpClient.post<{ runId: string; status: string }>(`${BASE_PATH}/scan/runs`, { docId }),

  /** PDF 원본으로부터 Tiptap 스캐폴딩(HTML & Markdown) 와이어프레임을 추출합니다. */
  extractScaffold: (docId: string) =>
    httpClient.post<ScaffoldExtractResponse>(`${BASE_PATH}/scaffold`, { docId }),

  /** 스캐폴드 생성을 백그라운드 실행으로 접수합니다. */
  startScaffold: (docId: string) =>
    httpClient.post<{ runId: string; status: string }>(`${BASE_PATH}/scaffold/runs`, { docId }),

  /** 아웃라인 분석을 동기로 실행합니다(채택본이 있으면 그대로 반환). */
  extractOutline: (docId: string, forceRefresh = false) =>
    httpClient.post<ExtractOutlineResponse>(`${BASE_PATH}/outline`, {
      docId,
      force_refresh: forceRefresh,
    }),

  /** 긴 분석을 HTTP 연결과 분리해 백그라운드 실행으로 접수합니다. */
  startOutline: (docId: string, forceRefresh = false) =>
    httpClient.post<{ runId: string; status: string }>(`${BASE_PATH}/outline/runs`, {
      docId,
      force_refresh: forceRefresh,
    }),
};
