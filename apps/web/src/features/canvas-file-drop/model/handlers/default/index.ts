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
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'generic',
      size: file.size,
    },
  }),
};
