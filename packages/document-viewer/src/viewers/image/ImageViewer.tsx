import { useState, useCallback, memo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

import type { DocumentViewerProps } from '../../types';

/**
 * ImageViewer
 * 
 * 호스트 비의존적(Host-Agnostic) 순수 React 이미지 뷰어.
 * JPG, PNG, WEBP, GIF, SVG 등 웹 표준 이미지를 스크롤바 없이 온전하게 렌더링하며,
 * 원본 해상도(naturalWidth, naturalHeight) 및 종횡비(aspectRatio)를 감지하여 부모 호스트에 전달합니다.
 */
export const ImageViewer = memo(function ImageViewer({
  url,
  title,
  onPageCountChange,
  onDimensionsChange,
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const naturalWidth = img.naturalWidth || 1;
      const naturalHeight = img.naturalHeight || 1;
      const aspectRatio = naturalWidth / naturalHeight;

      setIsLoading(false);
      setLoadError(null);

      // 이미지는 단일 페이지(1p)로 처리
      onPageCountChange?.(1);

      // 원본 치수 및 종횡비 전달
      onDimensionsChange?.({
        width: naturalWidth,
        height: naturalHeight,
        aspectRatio,
      });
    },
    [onPageCountChange, onDimensionsChange]
  );

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setLoadError('이미지를 로드하지 못했습니다.');
  }, []);

  if (loadError) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 text-rose-500 bg-rose-50/50 rounded-b-md">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-xs font-medium">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-100/70 rounded-b-md select-none p-2">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2 bg-slate-50/60 z-10">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-medium">이미지 불러오는 중...</span>
        </div>
      )}

      {/* Pure Image Renderer */}
      <img
        src={url}
        alt={title}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`
          max-w-full max-h-full object-contain rounded shadow-sm border border-slate-200/60 bg-white
          transition-opacity duration-200
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        draggable={false}
      />
    </div>
  );
});
