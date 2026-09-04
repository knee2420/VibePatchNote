import { httpClient } from '@/shared/api';

import type { ScanDocumentResponse } from '../model/types';

const BASE_PATH = '/api/v1/documents';

/** `POST /api/v1/documents/upload` 응답. 백엔드 `UploadResponse` 스키마와 1:1 대응합니다. */
export interface UploadDocumentResponse {
  status: string;
  job_id: string;
  message: string;
  file_url: string;
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
};
