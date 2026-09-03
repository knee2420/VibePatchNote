import type { Node } from '@xyflow/react';

import type { UploadDocumentResponse } from '@/entities/reference-document';

export interface CreateNodeParams {
  file: File;
  uploadResult: UploadDocumentResponse;
  position: { x: number; y: number };
}

/**
 * 파일 확장자/MIME 별 캔버스 노드 생성 규칙 플러그인.
 * 새 포맷을 지원하려면 이 인터페이스를 구현해 레지스트리에 등록합니다.
 */
export interface FileDropHandler {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes?: string[];
  description?: string;
  createNode: (params: CreateNodeParams) => Node;
}
