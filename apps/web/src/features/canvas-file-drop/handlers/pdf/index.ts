import type { FileDropHandler } from '../../model/types';

export const pdfHandler: FileDropHandler = {
  id: 'pdf-document',
  name: 'PDF Document',
  extensions: ['pdf'],
  mimeTypes: ['application/pdf'],
  description: 'PDF documents rendered in ReferenceDocumentNode',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'referenceDocument',
    position,
    data: {
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'pdf',
      size: file.size,
    },
  }),
};
