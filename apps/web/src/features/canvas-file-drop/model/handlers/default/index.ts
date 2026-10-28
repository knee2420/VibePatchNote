import { REFERENCE_DOCUMENT_NODE_TYPE } from '@/entities/reference-document';

import type { FileDropHandler } from '../../types';

export const defaultFallbackHandler: FileDropHandler = {
  id: 'default-fallback',
  name: 'Generic Document',
  extensions: [],
  description: 'Fallback handler for unregistered file formats',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: REFERENCE_DOCUMENT_NODE_TYPE,
    position,
    data: {
      // 노드는 포인터만 갖는다. 분석 결과는 docId 로 조회한다.
      docId: uploadResult.docId,
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'generic',
      size: file.size,
    },
  }),
};
