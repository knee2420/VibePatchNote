import { memo, useState, useMemo, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { Trash2, BookOpen, Maximize2, Minimize2 } from 'lucide-react';

import { viewerRegistry } from '@vibe/document-viewer';

import type { ReferenceDocumentData } from '../model/types';
import { NodeSpreadAnchor } from './NodeSpreadAnchor';

const themeStyles: Record<string, { container: string; header: string }> = {
  default: { container: 'bg-white border-slate-300', header: 'bg-slate-50 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/70 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/70 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/70 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/70 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

export const ReferenceDocumentNode = memo(function ReferenceDocumentNode({
  id,
  data,
  selected,
}: NodeProps<Node<ReferenceDocumentData, 'referenceDocument'>>) {
  const { setNodes } = useReactFlow();
  const [isSpread, setIsSpread] = useState(false);
  const [isFitContent, setIsFitContent] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const viewerDef = useMemo(
    () => viewerRegistry.get(data.fileType, data.url || data.title),
    [data.fileType, data.url, data.title]
  );

  const ViewerComponent = viewerDef.component;

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  const handleToggleFit = () => {
    setIsFitContent((prev) => !prev);
  };

  // 캔버스 호스트의 관심사: 노드가 선택되었을 때 캔버스 줌 버블링 차단 및 내부 스크롤 매핑
  const handleNodeWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!selected) return;
      // 캔버스 줌/팬 이벤트로 버블링되는 것을 호스트 차원에서 차단
      e.stopPropagation();

      // 자식 뷰어의 스크롤 컨테이너 탐색
      const scrollEl = e.currentTarget.querySelector('.overflow-y-auto, .overflow-x-auto') as HTMLElement | null;
      if (scrollEl) {
        if (isSpread) {
          // 가로 모드: 상하 휠(deltaY) 또는 좌우 휠(deltaX)을 가로 스크롤로 변환
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          scrollEl.scrollLeft += delta;
        } else {
          // 세로 모드: 위아래 스크롤
          scrollEl.scrollTop += e.deltaY;
        }
      }
    },
    [selected, isSpread]
  );

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  // 크기 산정 로직 (가로 전개 ↔ 콘텐츠 자동 핏 ↔ 기본 크기)
  const nodeDimensions = useMemo(() => {
    if (isSpread) {
      return 'w-[1400px] max-w-[92vw] h-[860px]';
    }
    if (isFitContent) {
      // 단면 문서나 핏 모드: 스크롤바 없이 1페이지 전체 완벽 표시
      return 'w-[640px] h-[910px]';
    }
    // 기본 카드 크기
    return 'w-[600px] h-[800px]';
  }, [isSpread, isFitContent]);

  return (
    <div
      className={`
      group/node rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style]
      ${currentTheme.container}
      ${selected ? '!border-blue-500 shadow-xl ring-2 ring-blue-300 z-30' : 'z-10 hover:z-20'}
      ${nodeDimensions}
      transition-[width,height] duration-300 ease-out
    `}
    >
      {/* Header acting as a safe drag area (Double click to Auto-fit) */}
      <div
        onDoubleClick={handleToggleFit}
        className={`px-4 py-3 border-b flex justify-between items-center rounded-t-[10px] cursor-grab active:cursor-grabbing select-none ${currentTheme.header}`}
        title="더블클릭하여 페이지 크기에 맞춤 (Fit to Content)"
      >
        <div className="flex items-center gap-2 min-w-0 pr-3">
          <BookOpen className="w-4 h-4 shrink-0 text-blue-600" />
          <h4 className="font-bold text-sm truncate" title={data.title}>
            {data.title}
          </h4>
          {pageCount && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/80 font-medium text-slate-600 shrink-0">
              {pageCount}p
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Fit to Content Toggle Button */}
          <button
            onClick={handleToggleFit}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer
              ${
                isFitContent
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }
            `}
            title={isFitContent ? '기본 크기로 복원' : '페이지 크기에 딱 맞춤 (더블클릭 단축키)'}
          >
            {isFitContent ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-slate-200/60 nodrag cursor-pointer"
            title="문서 카드 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Pluggable Viewer Body Wrapper with Wheel Interception */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col nodrag nopan" onWheel={handleNodeWheel}>
        <ViewerComponent
          url={data.url}
          title={data.title}
          isSpread={isSpread}
          onPageCountChange={setPageCount}
        />
      </div>

      {/* Independent Spread Anchor (Visible only when 2+ pages) */}
      {viewerDef.canSpread && pageCount !== null && pageCount > 1 && (
        <NodeSpreadAnchor
          isSpread={isSpread}
          pageCount={pageCount}
          selected={selected}
          onToggle={() => setIsSpread((prev) => !prev)}
        />
      )}

      {/* React Flow Handles */}
      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
