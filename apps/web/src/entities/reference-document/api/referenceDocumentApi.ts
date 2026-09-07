import { httpClient } from '@/shared/api';

import type { ScanDocumentResponse, ExtractOutlineResponse } from '../model/types';

const BASE_PATH = '/api/v1/documents';

/** `POST /api/v1/documents/upload` 응답. 백엔드 `UploadResponse` 스키마와 1:1 대응합니다. */
export interface UploadDocumentResponse {
  status: string;
  job_id: string;
  message: string;
  file_url: string;
}

export interface ScaffoldArchiveMeta {
  scaffoldId: string;
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

/** `POST /api/v1/documents/scaffold` 응답 스키마. */
export interface ScaffoldExtractResponse {
  status: string;
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
}


/** 참고 문서(reference-document) 도메인의 백엔드 API 통신 단일 진입점. */
export const referenceDocumentApi = {
  /** 참고 문서를 업로드하고 노드 생성에 필요한 메타를 돌려받습니다. */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.postFormData<UploadDocumentResponse>(`${BASE_PATH}/upload`, formData);
  },

  /** 문서 영역을 분석하여 표, 개조식 목록, 섹션 바운딩 박스를 추출합니다. */
  scanSegments: (filename: string) =>
    httpClient.post<ScanDocumentResponse>(`${BASE_PATH}/scan`, { filename }),

  /** PDF 원본으로부터 Tiptap 스캐폴딩(HTML & Markdown) 와이어프레임을 추출합니다. */
  extractScaffold: (filename: string) =>
    httpClient.post<ScaffoldExtractResponse>(`${BASE_PATH}/scaffold`, { filename }),

  /** 문서의 계층적 아웃라인과 소속 세부 엘리먼트를 2-Stage로 추출(또는 캐시 로드)합니다. */
  extractOutline: (filename: string, forceRefresh = false) =>
    httpClient.post<ExtractOutlineResponse>(`${BASE_PATH}/outline`, {
      filename,
      force_refresh: forceRefresh,
    }),

  /** 스토리지에 캐시된 아웃라인 패키지를 조회합니다. */
  getOutline: (filename: string) =>
    httpClient.get<ExtractOutlineResponse>(`${BASE_PATH}/outline/${encodeURIComponent(filename)}`),
};
