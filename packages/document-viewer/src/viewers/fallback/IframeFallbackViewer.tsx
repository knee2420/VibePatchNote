import { memo } from 'react';
import type { DocumentViewerProps } from '../../types';

export const IframeFallbackViewer = memo(function IframeFallbackViewer({
  url,
  title,
  selected = false,
}: DocumentViewerProps) {
  return (
    <div className="flex-1 w-full h-full p-0 overflow-hidden rounded-b-md relative bg-white">
      <iframe
        src={url}
        className={`w-full h-full border-none ${selected ? 'pointer-events-auto' : 'pointer-events-none'}`}
        title={title}
      />
      {!selected && (
        <div
          className="absolute inset-0 bg-transparent cursor-pointer"
          title="클릭하여 문서 인터랙션 활성화"
        />
      )}
    </div>
  );
});
