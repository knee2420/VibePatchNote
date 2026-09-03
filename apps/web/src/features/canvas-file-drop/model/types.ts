import type { Node } from '@xyflow/react';

export interface UploadResult {
  file_url: string;
  job_id?: string;
  filename?: string;
  message?: string;
  [key: string]: unknown;
}

export interface CreateNodeParams {
  file: File;
  uploadResult: UploadResult;
  position: { x: number; y: number };
}

export interface FileDropHandler {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes?: string[];
  description?: string;
  createNode: (params: CreateNodeParams) => Node;
}
