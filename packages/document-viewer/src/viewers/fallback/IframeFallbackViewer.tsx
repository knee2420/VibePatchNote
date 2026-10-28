import { memo } from 'react';
import type { DocumentViewBaseProps } from '../../types';

export const IframeFallbackViewer = memo(function IframeFallbackViewer({
  url,
  title,
}: DocumentViewBaseProps) {
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
