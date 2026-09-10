import { REFERENCE_DOCUMENT_NODE_TYPE } from '@/entities/reference-document';

import type { FileDropHandler } from '../../types';

export const imageHandler: FileDropHandler = {
  id: 'image-document',
  name: 'Image Document',
  extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
  description: 'Image reference cards rendered in ReferenceDocumentCard',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: REFERENCE_DOCUMENT_NODE_TYPE,
    position,
    data: {
      // 노드는 포인터만 갖는다. 분석 결과는 docId 로 조회한다.
      docId: uploadResult.docId,
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'image',
      size: file.size,
    },
  }),
};
