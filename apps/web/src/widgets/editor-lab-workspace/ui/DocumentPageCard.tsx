import { useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

export interface DocumentPageCardProps {
  pageNumber: number;
  totalPages?: number;
  pageHtml: string;
  documentKey: string;
  containerWidth: number;
  onChangeHtml: (pageNumber: number, html: string) => void;
  onChangeMarkdown?: (md: string) => void;
  onOpenSoloTab?: (pageNumber: number) => void;
  customScale?: number;
  autoFit?: boolean;
}

const BASE_PAGE_WIDTH = 595; // A4 표준 너비 (pt/px)
const BASE_PAGE_HEIGHT = 842; // A4 표준 높이 (pt/px)

/**
 * DocumentPageCard
 *
 * 불필요한 이중 래퍼와 고정 배너를 배제하고,
 * 순수한 A4 규격 종이 한 장을 부모 컨테이너 폭에 맞추어
 * 반응형(Auto-Fit) 스케일링으로 무결점 렌더링하는 독립 페이지 컴포넌트입니다.
 */
export function DocumentPageCard({
  pageNumber,
  pageHtml,
  documentKey,
  containerWidth,
  onChangeHtml,
  onChangeMarkdown,
  onOpenSoloTab,
  customScale,
  autoFit = true,
}: DocumentPageCardProps) {
  // 컨테이너 너비에 맞춘 자동 배율 계산 (패딩 48px 확보)
  const scale = useMemo(() => {
    if (customScale !== undefined) {
      return customScale;
    }
    if (!autoFit || containerWidth <= 0) {
      return 1;
    }
    const availableWidth = Math.max(280, containerWidth - 48);
    // 595px보다 좁으면 비례 축소, 넓으면 1.0(최대 원본 크기) 유지
    return Math.min(1.0, availableWidth / BASE_PAGE_WIDTH);
  }, [containerWidth, customScale, autoFit]);

  const scaledWidth = Math.round(BASE_PAGE_WIDTH * scale);
  const scaledHeight = Math.round(BASE_PAGE_HEIGHT * scale);

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
      }}
      className="relative group shrink-0 my-4 transition-all duration-150"
    >
      {/* 1. 상단 미니멀 플로팅 메타 뱃지 (마우스 호버 시 강조) */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-slate-200">PAGE {pageNumber}</span>
          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline-block">A4 규격</span>
          {scale < 0.99 && (
            <span className="text-[10px] bg-slate-800/90 text-indigo-300 px-1.5 py-0.2 rounded font-mono border border-slate-700/60 font-semibold">
              {Math.round(scale * 100)}% 맞춤
            </span>
          )}
        </div>

        {onOpenSoloTab && (
          <button
            type="button"
            onClick={() => onOpenSoloTab(pageNumber)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-200 bg-slate-900/90 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xs"
            title="이 페이지만 단독 편집 탭으로 분리하여 열기"
          >
            <Maximize2 className="w-3 h-3 text-indigo-400" />
            <span>단독 탭 열기</span>
          </button>
        )}
      </div>

      {/* 2. 실제 A4 종이 캔버스 (Scale 변환 적용) */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${BASE_PAGE_WIDTH}px`,
          minHeight: `${BASE_PAGE_HEIGHT}px`,
        }}
        className="bg-white text-slate-900 shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-slate-300/80 rounded-[2px] p-6 select-text overflow-hidden hover:border-indigo-400/60 transition-colors"
      >
        <ScaffoldCanvasEditor
          key={`${documentKey}-p${pageNumber}`}
          initialContent={pageHtml}
          onChangeHtml={(html) => onChangeHtml(pageNumber, html)}
          onChangeMarkdown={onChangeMarkdown}
        />
      </div>
    </div>
  );
}
