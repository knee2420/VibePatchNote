import { memo, useCallback, useMemo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';

import { viewerRegistry } from '@vibe/document-viewer';

import { useCanvasSettings } from '@/shared/model';

import { useDocumentLayout } from '../lib/useDocumentLayout';
import { useNodeResize } from '../lib/useNodeResize';
import { useNodeWheelScroll } from '../lib/useNodeWheelScroll';
import { useSegmentEditing } from '../model/useSegmentEditing';
import { useDocumentScaffold } from '../model/useDocumentScaffold';
import { REFERENCE_DOCUMENT_NODE_TYPE, type ReferenceDocumentData } from '../model/types';
import { CardResizeFrame } from './CardResizeFrame';
import { NodeSpreadAnchor } from './NodeSpreadAnchor';
import { ReferenceCardHeader } from './ReferenceCardHeader';
import { getReferenceCardTheme } from './referenceCardTheme';
import { SyncMappingHighlightOverlay } from './SyncMappingHighlightOverlay';

/**
 * ReferenceDocumentCard (FSD Entity UI)
 *
 * 참고 문서 도메인의 캔버스 노드 표현. 뷰어 엔진(`@vibe/document-viewer`)을 조합해
 * 크기 핏 / 휠 가로채기 / 펼침 앵커 / 마우스 리사이징 및 문서 영역 스캔을 제공합니다.
 * 상태·통신 로직은 전부 훅이 소유하고, 이 컴포넌트는 조합과 렌더링만 담당합니다.
 */
export const ReferenceDocumentCard = memo(function ReferenceDocumentCard({
  id,
  data,
  selected = false,
}: NodeProps<Node<ReferenceDocumentData, typeof REFERENCE_DOCUMENT_NODE_TYPE>>) {
  const { setNodes } = useReactFlow();
  const enableSmartSnap = useCanvasSettings((s) => s.enableSmartSnap);

  const viewerDef = useMemo(
    () => viewerRegistry.get(data.fileType, data.url || data.title),
    [data.fileType, data.url, data.title]
  );
  const ViewerComponent = viewerDef.component;

  const { isResizing, customSize, onResizeStart, onResize, onResizeEnd, resetCustomSize } =
    useNodeResize(id);

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

  const { handleNodeWheel } = useNodeWheelScroll({ selected, isSpread });

  const {
    segments,
    isScanning,
    isEditMode,
    scan,
    toggleEditMode,
    updateSegment,
    createSegment,
    deleteSegment,
  } = useSegmentEditing({
    nodeId: id,
    title: data.title,
    url: data.url,
    initialSegments: data.segments,
    onScanSuccess: (loaded) =>
      alert(`문서 분석 완료: 총 ${loaded.length}개의 논리 세그먼트(표/목록/섹션)가 감지되었습니다.`),
    onScanError: () => alert('문서 영역 스캔 중 오류가 발생했습니다.'),
  });

  const { isExtractingScaffold, extractScaffold } = useDocumentScaffold({
    nodeId: id,
    title: data.title,
    url: data.url,
    onSuccess: (scaffoldTitle) =>
      alert(`스캐폴딩 추출 완료: [${scaffoldTitle}] 노드가 캔버스에 연결되었습니다.`),
    onError: () => alert('Tiptap 서식 스캐폴딩 추출 중 오류가 발생했습니다.'),
  });

  // 프리셋 토글 시에는 수동 크기를 버리고 자동 맞춤 우선권을 복원합니다.
  const onToggleSpreadWithReset = useCallback(() => {
    resetCustomSize();
    handleToggleSpread();
  }, [resetCustomSize, handleToggleSpread]);

  const onToggleFitWithReset = useCallback(() => {
    resetCustomSize();
    handleToggleFit();
  }, [resetCustomSize, handleToggleFit]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  }, [id, setNodes]);

  const theme = getReferenceCardTheme(data.theme);

  const containerStyle = useMemo(
    () =>
      customSize
        ? { width: `${customSize.width}px`, height: `${customSize.height}px` }
        : dimensionStyle,
    [customSize, dimensionStyle]
  );

  return (
    <div
      style={containerStyle}
      className={`
        group/node rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style]
        ${theme.container}
        ${selected ? '!border-blue-500 shadow-xl ring-2 ring-blue-300 z-30 nowheel' : 'z-10 hover:z-20'}
        ${customSize ? '' : dimensionClass}
        ${isResizing ? '' : 'transition-[width,height] duration-300 ease-out'}
      `}
    >
      <CardResizeFrame
        selected={selected}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />

      <ReferenceCardHeader
        title={data.title}
        pageCount={pageCount}
        viewerDefId={viewerDef.id}
        isFitContent={isFitContent}
        headerThemeClass={theme.header}
        isScanning={isScanning}
        hasSegments={segments.length > 0}
        isEditMode={isEditMode}
        isExtractingScaffold={isExtractingScaffold}
        onToggleFit={onToggleFitWithReset}
        onScan={scan}
        onExtractScaffold={extractScaffold}
        onToggleEditMode={toggleEditMode}
        onDelete={handleDelete}
      />

      {/* 플러그인 뷰어 본문 + 휠 가로채기 래퍼 */}
      <div
        className={`flex-1 w-full h-full overflow-hidden flex flex-col relative nodrag nopan ${selected ? 'nowheel' : ''}`}
        onWheel={handleNodeWheel}
      >
        <ViewerComponent
          url={data.url}
          title={data.title}
          isSpread={isSpread}
          segments={segments}
          isEditMode={isEditMode}
          enableSmartSnap={enableSmartSnap}
          onUpdateSegment={updateSegment}
          onCreateSegment={createSegment}
          onDeleteSegment={deleteSegment}
          onPageCountChange={setPageCount}
          onDimensionsChange={setDimensions}
        />
        <SyncMappingHighlightOverlay nodeId={id} fileName={data.url || data.title} />
      </div>

      {/* 2페이지 이상일 때만 보이는 펼침 앵커 */}
      {viewerDef.canSpread && (
        <NodeSpreadAnchor
          isSpread={isSpread}
          pageCount={pageCount || 1}
          selected={selected}
          onToggle={onToggleSpreadWithReset}
        />
      )}

      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
