import type { FileDropHandler } from '../../model/types';

export const textHandler: FileDropHandler = {
  id: 'text-document',
  name: 'Text & Markdown Document',
  extensions: ['txt', 'md', 'markdown', 'log'],
  mimeTypes: ['text/plain', 'text/markdown'],
  description: 'Plain text and Markdown notes rendered in ReferenceDocumentNode',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'referenceDocument',
    position,
    data: {
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'text',
      size: file.size,
    },
  }),
};
