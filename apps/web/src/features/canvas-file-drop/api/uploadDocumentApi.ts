import { httpClient } from '@/shared/api';

import type { UploadResult } from '../model/types';

export interface DocumentUploadResponse extends UploadResult {
  message: string;
  filename: string;
  file_url: string;
  job_id: string;
}

/** 레퍼런스 문서를 백엔드에 업로드하고 노드 생성에 필요한 메타를 돌려받습니다. */
export function uploadDocumentApi(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return httpClient.postFormData<DocumentUploadResponse>('/api/v1/documents/upload', formData);
}
