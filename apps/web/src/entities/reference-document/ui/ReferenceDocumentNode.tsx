import { memo, useState, useMemo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { ChevronRight, ChevronLeft, Trash2, BookOpen } from 'lucide-react';

import { viewerRegistry } from '@vibe/document-viewer';

import type { ReferenceDocumentData } from '../model/types';

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
  const [pageCount, setPageCount] = useState<number | null>(null);

  const viewerDef = useMemo(
    () => viewerRegistry.get(data.fileType, data.url || data.title),
    [data.fileType, data.url, data.title]
  );

  const ViewerComponent = viewerDef.component;

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  return (
    <div
      className={`
      rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style_paint]
      ${currentTheme.container}
      ${selected ? '!border-blue-500 shadow-xl ring-2 ring-blue-300' : ''}
      ${isSpread ? 'w-[1400px] max-w-[92vw] h-[860px]' : 'w-[600px] h-[800px]'}
      transition-[width,height] duration-300 ease-out
    `}
    >
      {/* Header acting as a safe drag area */}
      <div
        className={`px-4 py-3 border-b flex justify-between items-center rounded-t-[10px] cursor-grab active:cursor-grabbing select-none ${currentTheme.header}`}
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

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-slate-200/60 nodrag"
            title="문서 카드 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Pluggable Viewer Body */}
      <ViewerComponent
        url={data.url}
        title={data.title}
        isSpread={isSpread}
        selected={selected}
        onPageCountChange={setPageCount}
      />

      {/* Horizontal Spread Toggle Button (Floating at Right Border) */}
      {viewerDef.canSpread && (
        <button
          onClick={() => setIsSpread((prev) => !prev)}
          className={`
            absolute -right-4 top-1/2 -translate-y-1/2 z-30 nodrag
            w-9 h-9 rounded-full bg-white border-2 shadow-lg flex items-center justify-center
            transition-all duration-200 cursor-pointer
            ${
              isSpread
                ? 'border-blue-500 text-blue-600 hover:bg-blue-50 hover:scale-110'
                : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-500 hover:scale-110'
            }
          `}
          title={isSpread ? '세로 기본 모드로 접기' : '전체 페이지를 가로로 펼치기 (Unfold)'}
        >
          {isSpread ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      )}

      {/* React Flow Handles */}
      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
