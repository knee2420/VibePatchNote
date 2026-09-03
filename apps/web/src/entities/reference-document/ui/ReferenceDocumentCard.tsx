import { memo, useMemo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';

import { viewerRegistry } from '@vibe/document-viewer';

import { useDocumentLayout } from '../lib/useDocumentLayout';
import { useNodeWheelScroll } from '../lib/useNodeWheelScroll';
import type { ReferenceDocumentData } from '../model/types';
import { NodeSpreadAnchor } from './NodeSpreadAnchor';
import { ReferenceCardHeader } from './ReferenceCardHeader';

const themeStyles: Record<string, { container: string; header: string }> = {
  default: { container: 'bg-white border-slate-300', header: 'bg-slate-50 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/70 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/70 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/70 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/70 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

/**
 * ReferenceDocumentCard (FSD Entity UI)
 *
 * 참고 문서 도메인의 캔버스 노드 표현. 뷰어 엔진(`@vibe/document-viewer`)을 조합해
 * 크기 핏 / 휠 가로채기 / 펼침 앵커를 제공합니다.
 */
export const ReferenceDocumentCard = memo(function ReferenceDocumentCard({
  id,
  data,
  selected = false,
}: NodeProps<Node<ReferenceDocumentData, 'referenceDocument'>>) {
  const { setNodes } = useReactFlow();

  const viewerDef = useMemo(
    () => viewerRegistry.get(data.fileType, data.url || data.title),
    [data.fileType, data.url, data.title]
  );

  const ViewerComponent = viewerDef.component;

  // Layout & Dimension Feature Hook
  const {
    isSpread,
    isFitContent,
    pageCount,
    setPageCount,
    setDimensions,
    handleToggleSpread,
    handleToggleFit,
    dimensionClass,
    dimensionStyle,
  } = useDocumentLayout({ viewerDefId: viewerDef.id });

  // Canvas Wheel Feature Hook
  const { handleNodeWheel } = useNodeWheelScroll({ selected, isSpread });

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  return (
    <div
      style={dimensionStyle}
      className={`
        group/node rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style]
        ${currentTheme.container}
        ${selected ? '!border-blue-500 shadow-xl ring-2 ring-blue-300 z-30' : 'z-10 hover:z-20'}
        ${dimensionClass}
        transition-[width,height] duration-300 ease-out
      `}
    >
      {/* Composed Header */}
      <ReferenceCardHeader
        title={data.title}
        pageCount={pageCount}
        viewerDefId={viewerDef.id}
        isFitContent={isFitContent}
        headerThemeClass={currentTheme.header}
        onToggleFit={handleToggleFit}
        onDelete={handleDelete}
      />

      {/* Dynamic Pluggable Viewer Body Wrapper with Wheel Interception */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col nodrag nopan" onWheel={handleNodeWheel}>
        <ViewerComponent
          url={data.url}
          title={data.title}
          isSpread={isSpread}
          onPageCountChange={setPageCount}
          onDimensionsChange={setDimensions}
        />
      </div>

      {/* Independent Spread Anchor (Visible only when 2+ pages) */}
      {viewerDef.canSpread && (
        <NodeSpreadAnchor
          isSpread={isSpread}
          pageCount={pageCount || 1}
          selected={selected}
          onToggle={handleToggleSpread}
        />
      )}

      {/* React Flow Handles */}
      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
