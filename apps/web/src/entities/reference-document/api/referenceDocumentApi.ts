import { httpClient } from '@/shared/api';

import type { ScanDocumentResponse } from '../model/types';

const BASE_PATH = '/api/v1/documents';

/** 참고 문서(reference-document) 도메인의 백엔드 API 통신 단일 진입점. */
export const referenceDocumentApi = {
  /**
   * 문서 영역을 분석하여 표, 개조식 목록, 섹션 바운딩 박스를 추출합니다 (agy-cli 연동).
   */
  scanSegments: (filename: string) =>
    httpClient.post<ScanDocumentResponse>(`${BASE_PATH}/scan`, { filename }),
};
