import type { UploadResult } from '../model/types';

export interface DocumentUploadResponse extends UploadResult {
  message: string;
  filename: string;
  file_url: string;
  job_id: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function uploadDocumentApi(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorDetail = await response.text().catch(() => 'Network response was not ok');
    throw new Error(`Upload failed (${response.status}): ${errorDetail}`);
  }

  return response.json();
}
