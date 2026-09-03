import type { FileDropHandler } from '../../model/types';

export const imageHandler: FileDropHandler = {
  id: 'image-document',
  name: 'Image Document',
  extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
  description: 'Image reference cards rendered in ReferenceDocumentNode',
  createNode: ({ file, uploadResult, position }) => ({
    id: `ref-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'referenceDocument',
    position,
    data: {
      title: file.name,
      url: uploadResult.file_url,
      fileType: 'image',
      size: file.size,
    },
  }),
};
