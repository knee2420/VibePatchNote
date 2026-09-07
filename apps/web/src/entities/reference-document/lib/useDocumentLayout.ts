import { useState, useMemo, useCallback } from 'react';

import { REFERENCE_CARD_SIZE } from '../model/types';

interface UseDocumentLayoutProps {
  viewerDefId: string;
  isOutlineOpen?: boolean;
}

export function useDocumentLayout({ viewerDefId, isOutlineOpen = false }: UseDocumentLayoutProps) {
  const [isSpread, setIsSpread] = useState(false);
  const [isFitContent, setIsFitContent] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

  const handleToggleSpread = useCallback(() => {
    setIsSpread((prev) => !prev);
  }, []);

  const handleToggleFit = useCallback(() => {
    setIsFitContent((prev) => !prev);
  }, []);

  // 크기 및 인라인 스타일 산정 로직
  const { dimensionClass, dimensionStyle } = useMemo(() => {
    if (isSpread) {
      return {
        dimensionClass: 'w-[1400px] max-w-[92vw] h-[645px]',
        dimensionStyle: undefined,
      };
    }

    if (isFitContent) {
      // 1. 이미지 뷰어이고 원본 해상도/종횡비가 감지된 경우 (Aspect Ratio Hug Fit)
      if (viewerDefId === 'image' && dimensions?.aspectRatio) {
        const targetWidth = isOutlineOpen ? 890 : 550;
        const imageHeight = Math.round(550 / dimensions.aspectRatio);
        const headerHeight = 48;
        const padding = 16;
        // 안전 가드: 최소 320px ~ 최대 960px
        const calculatedHeight = Math.min(Math.max(imageHeight + headerHeight + padding, 320), 960);
        return {
          dimensionClass: '',
          dimensionStyle: {
            width: `${targetWidth}px`,
            height: `${calculatedHeight}px`,
          },
        };
      }

      // 2. PDF 단면 문서 (A4 규격 종이 520px 기준 여백 최소화 핏)
      return {
        dimensionClass: isOutlineOpen ? 'w-[916px] h-[814px]' : 'w-[556px] h-[814px]',
        dimensionStyle: undefined,
      };
    }

    // 3. 기본 카드 크기 (패널 열림 시 960px 확장)
    const baseWidth = isOutlineOpen ? 960 : REFERENCE_CARD_SIZE.width;
    return {
      dimensionClass: '',
      dimensionStyle: {
        width: `${baseWidth}px`,
        height: `${REFERENCE_CARD_SIZE.height}px`,
      },
    };
  }, [isSpread, isFitContent, isOutlineOpen, viewerDefId, dimensions]);

  return {
    isSpread,
    isFitContent,
    pageCount,
    setPageCount,
    dimensions,
    setDimensions,
    handleToggleSpread,
    handleToggleFit,
    dimensionClass,
    dimensionStyle,
  };
}
