import { useCallback, useState } from 'react';
import type { TextContent, TextItem } from 'react-pdf';

/** react-pdf 의 `Page onLoadSuccess` 가 넘겨주는 페이지 객체 중 실제로 쓰는 부분만. */
export interface PdfPageInfo {
  width: number;
  height: number;
  view?: number[];
  getTextContent?: () => Promise<TextContent>;
}

const NORMALIZED_MAX = 1000;

function isTextItem(item: TextContent['items'][number]): item is TextItem {
  return 'str' in item && 'transform' in item;
}

/**
 * PDF 텍스트 엔진에서 페이지별 텍스트 줄의 Y좌표를 0~1000 정규화 좌표로 추출합니다.
 * 세그먼트 편집의 스마트 마그넷 스냅 가이드가 이 좌표를 앵커로 씁니다.
 *
 * 텍스트가 없는 스캔 이미지 PDF 는 조용히 건너뜁니다.
 */
export function usePdfTextLines() {
  const [textLinesByPage, setTextLinesByPage] = useState<Record<number, number[]>>({});

  const collectTextLines = useCallback((page: PdfPageInfo, pageNumber: number) => {
    if (typeof page.getTextContent !== 'function') return;

    page
      .getTextContent()
      .then((textContent) => {
        const pageHeight = page.view?.[3] || page.height || NORMALIZED_MAX;
        const normalizedYs = new Set<number>();

        for (const item of textContent.items) {
          if (!isTextItem(item) || !item.str.trim()) continue;

          const ty = item.transform[5];
          const normalizedY = Math.max(
            0,
            Math.min(NORMALIZED_MAX, Math.round(((pageHeight - ty) / pageHeight) * NORMALIZED_MAX))
          );
          normalizedYs.add(normalizedY);
        }

        const next = Array.from(normalizedYs).sort((a, b) => a - b);
        setTextLinesByPage((prev) => {
          // **값이 같으면 이전 참조를 그대로 돌려준다.** 매번 새 객체·새 배열을
          // 만들면 `textLines` 프롭 신원이 바뀌어 `PdfPage` 의 memo 가 깨지고,
          // 다시 그려진 `<Page>` 가 `onLoadSuccess` 를 또 부른다 — 그 콜백이
          // 바로 여기다. 끝나지 않는 리렌더(화면 깜빡임)의 진원지였다.
          const current = prev[pageNumber];
          if (
            current &&
            current.length === next.length &&
            current.every((value, index) => value === next[index])
          ) {
            return prev;
          }
          return { ...prev, [pageNumber]: next };
        });
      })
      .catch(() => {
        // 텍스트 레이어가 없는 스캔 PDF: 기존 세그먼트 경계만 스냅 앵커로 사용합니다.
      });
  }, []);

  return { textLinesByPage, collectTextLines };
}
