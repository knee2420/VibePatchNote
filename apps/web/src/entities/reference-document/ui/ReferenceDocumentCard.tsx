import { memo, useMemo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps, type Node } from '@xyflow/react';

import { viewerRegistry } from '@vibe/document-viewer';

import { useDocumentLayout } from '../lib/useDocumentLayout';
import { useNodeWheelScroll } from '../lib/useNodeWheelScroll';
import { useDocumentScan } from '../model/useDocumentScan';
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
 * 크기 핏 / 휠 가로채기 / 펼침 앵커 / 마우스 리사이징 및 문서 영역 스캔(agy-cli)을 제공합니다.
 */
export const ReferenceDocumentCard = memo(function ReferenceDocumentCard({
  id,
  data,
  selected = false,
}: NodeProps<Node<ReferenceDocumentData, 'referenceDocument'>>) {
  const { setNodes } = useReactFlow();
  const [isResizing, setIsResizing] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);

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

  // 문서 영역 스캔 훅 (agy-cli 백엔드 파이프라인 연동)
  const { isScanning, segments, scanDocument } = useDocumentScan({
    onSuccess: (loaded) => {
      alert(`문서 분석 완료: 총 ${loaded.length}개의 논리 세그먼트(표/목록/섹션)가 감지되었습니다.`);
    },
    onError: () => {
      alert('문서 영역 스캔 중 오류가 발생했습니다.');
    },
  });

  const filename = useMemo(() => {
    if (data.url) {
      const clean = data.url.split('?')[0];
      return clean.split('/').pop() || data.title;
    }
    return data.title;
  }, [data.url, data.title]);

  const handleScan = useCallback(() => {
    scanDocument(filename);
  }, [scanDocument, filename]);

  // 사용자가 수동 리사이즈한 경우 프리셋 토글 시 크기 리셋 -> 자동 맞춤(Fit/Spread) 우선권 복원
  const resetCustomDimensions = useCallback(() => {
    setCustomSize(null);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            width: undefined,
            height: undefined,
            style: {
              ...node.style,
              width: undefined,
              height: undefined,
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const onToggleSpreadWithReset = useCallback(() => {
    resetCustomDimensions();
    handleToggleSpread();
  }, [resetCustomDimensions, handleToggleSpread]);

  const onToggleFitWithReset = useCallback(() => {
    resetCustomDimensions();
    handleToggleFit();
  }, [resetCustomDimensions, handleToggleFit]);

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  const containerStyle = useMemo(() => {
    if (customSize) {
      return {
        width: `${customSize.width}px`,
        height: `${customSize.height}px`,
      };
    }
    return dimensionStyle;
  }, [customSize, dimensionStyle]);

  return (
    <div
      style={containerStyle}
      className={`
        group/node rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style]
        ${currentTheme.container}
        ${selected ? '!border-blue-500 shadow-xl ring-2 ring-blue-300 z-30 nowheel' : 'z-10 hover:z-20'}
        ${customSize ? '' : dimensionClass}
        ${isResizing ? '' : 'transition-[width,height] duration-300 ease-out'}
      `}
    >
      {/* 테두리 마우스 호버 및 선택 시 나타나는 크기 조절 핸들 */}
      <NodeResizer
        minWidth={360}
        minHeight={260}
        isVisible={true}
        onResizeStart={() => setIsResizing(true)}
        onResize={(_, params) => {
          setCustomSize({ width: params.width, height: params.height });
        }}
        onResizeEnd={(_, params) => {
          setIsResizing(false);
          setCustomSize({ width: params.width, height: params.height });
        }}
        lineClassName={`border-blue-500 pointer-events-none transition-opacity duration-150 ${
          selected ? 'opacity-90' : 'opacity-0 group-hover/node:opacity-60'
        }`}
        handleClassName={`!w-2.5 !h-2.5 !bg-white !border-2 !border-blue-500 !rounded-full shadow-xs transition-opacity duration-150 ${
          selected ? '!opacity-100' : '!opacity-0 group-hover/node:!opacity-100'
        }`}
      />

      {/* Composed Header */}
      <ReferenceCardHeader
        title={data.title}
        pageCount={pageCount}
        viewerDefId={viewerDef.id}
        isFitContent={isFitContent}
        headerThemeClass={currentTheme.header}
        isScanning={isScanning}
        hasSegments={segments.length > 0}
        onToggleFit={onToggleFitWithReset}
        onScan={handleScan}
        onDelete={handleDelete}
      />

      {/* Dynamic Pluggable Viewer Body Wrapper with Wheel Interception */}
      <div
        className={`flex-1 w-full h-full overflow-hidden flex flex-col nodrag nopan ${selected ? 'nowheel' : ''}`}
        onWheel={handleNodeWheel}
      >
        <ViewerComponent
          url={data.url}
          title={data.title}
          isSpread={isSpread}
          segments={segments}
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
          onToggle={onToggleSpreadWithReset}
        />
      )}

      {/* React Flow Handles */}
      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
