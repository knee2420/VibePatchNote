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
};
