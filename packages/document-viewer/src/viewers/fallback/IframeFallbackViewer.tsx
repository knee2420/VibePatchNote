import { memo } from 'react';
import type { DocumentViewerProps } from '../../types';

export const IframeFallbackViewer = memo(function IframeFallbackViewer({
  url,
  title,
}: DocumentViewerProps) {
  return (
    <div className="flex-1 w-full h-full p-0 overflow-hidden rounded-b-md relative bg-white">
      <iframe
        src={url}
        className="w-full h-full border-none pointer-events-auto"
        title={title}
      />
    </div>
  );
});
