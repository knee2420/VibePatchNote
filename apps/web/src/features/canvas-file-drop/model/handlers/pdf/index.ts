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
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'pdf',
      size: file.size,
    },
  }),
};
