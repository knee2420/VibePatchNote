import { REFERENCE_DOCUMENT_NODE_TYPE } from '@/entities/reference-document';

import type { FileDropHandler } from '../../types';

export const pdfHandler: FileDropHandler = {
  id: 'pdf-document',
  name: 'PDF Document',
  extensions: ['pdf'],
  mimeTypes: ['application/pdf'],
  description: 'PDF documents rendered in ReferenceDocumentCard',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: REFERENCE_DOCUMENT_NODE_TYPE,
    position,
    data: {
      // 노드는 포인터만 갖는다. 분석 결과는 docId 로 조회한다.
      docId: uploadResult.docId,
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'pdf',
      size: file.size,
    },
  }),
};
