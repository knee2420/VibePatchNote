import type { FileDropHandler } from '../../model/types';

export const defaultFallbackHandler: FileDropHandler = {
  id: 'default-fallback',
  name: 'Generic Document',
  extensions: [],
  description: 'Fallback handler for unregistered file formats',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'referenceDocument',
    position,
    data: {
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'generic',
      size: file.size,
    },
  }),
};
