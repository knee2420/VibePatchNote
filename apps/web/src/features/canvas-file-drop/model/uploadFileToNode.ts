import type { Node, XYPosition } from '@xyflow/react';

import { referenceDocumentApi } from '@/entities/reference-document';

import { fileDropRegistry } from './fileDropRegistry';

/**
 * 파일 1개를 업로드하고, 확장자에 맞는 핸들러로 캔버스 노드를 만들어 돌려줍니다.
 *
 * 드래그&드롭 경로와 파일 선택 다이얼로그 경로가 같은 절차를 쓰므로
 * 이 함수 하나만 진실로 둡니다. 등록된 핸들러가 없으면 null 을 돌려줍니다.
 */
export async function uploadFileToNode(file: File, position: XYPosition): Promise<Node | null> {
  const handler = fileDropRegistry.getHandler(file);
  if (!handler) {
    console.warn(`[canvas-file-drop] No handler found for file: ${file.name}`);
    return null;
  }

  const uploadResult = await referenceDocumentApi.upload(file);
  return handler.createNode({ file, uploadResult, position });
}
