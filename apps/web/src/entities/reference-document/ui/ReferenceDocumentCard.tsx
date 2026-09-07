import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
  type Node,
} from '@xyflow/react';

import { viewerRegistry, type ViewerHighlight } from '@vibe/document-viewer';

import { useCanvasSettings, useSyncMappingStore } from '@/shared/model';

import { useDocumentLayout } from '../lib/useDocumentLayout';
import { useNodeResize } from '../lib/useNodeResize';
import { useNodeWheelScroll } from '../lib/useNodeWheelScroll';
import { useSegmentEditing } from '../model/useSegmentEditing';
import { useDocumentScaffold } from '../model/useDocumentScaffold';
import { useDocumentOutline } from '../model/useDocumentOutline';
import {
  REFERENCE_DOCUMENT_NODE_TYPE,
  type ReferenceDocumentData,
  type DocumentElementItem,
} from '../model/types';
import { CardResizeFrame } from './CardResizeFrame';
import { NodeSpreadAnchor } from './NodeSpreadAnchor';
import { ReferenceCardHeader } from './ReferenceCardHeader';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { getReferenceCardTheme } from './referenceCardTheme';

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
  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef<HTMLDivElement>(null);
  const enableSmartSnap = useCanvasSettings((s) => s.enableSmartSnap);
  const activeMapping = useSyncMappingStore((s) => s.activeMapping);

  const [activeElement, setActiveElement] = useState<DocumentElementItem | null>(null);

  // 이 카드가 해당 매핑의 대상이거나 아웃라인 엘리먼트가 선택되었을 때만 강조한다 (타 카드 번짐 완벽 방지)
  const highlight = useMemo<ViewerHighlight | null>(() => {
    if (activeElement?.box_2d) {
      return {
        id: activeElement.id,
        page: activeElement.page ?? 1,
        box_2d: activeElement.box_2d,
        label: activeElement.label,
      };
    }
    if (!activeMapping?.box_2d) return null;
    if (activeMapping.targetNodeId) {
      if (activeMapping.targetNodeId !== id) return null;
    } else if (activeMapping.sourcePdfFileName) {
      const isMatchingFile =
        data.title === activeMapping.sourcePdfFileName ||
        (data.url && data.url.includes(encodeURIComponent(activeMapping.sourcePdfFileName))) ||
        (data.url && data.url.includes(activeMapping.sourcePdfFileName));
      if (!isMatchingFile) return null;
    } else {
      return null;
    }

    return {
      id: activeMapping.id,
      page: activeMapping.page ?? 1,
      box_2d: activeMapping.box_2d,
      label: activeMapping.label,
      number: activeMapping.number,
    };
  }, [activeElement, activeMapping, id, data.title, data.url]);

  const viewerDef = useMemo(
    () => viewerRegistry.get(data.fileType, data.url || data.title),
    [data.fileType, data.url, data.title]
  );
  const ViewerComponent = viewerDef.component;

  const { isResizing, customSize, onResizeStart, onResize, onResizeEnd, resetCustomSize } =
    useNodeResize(id);

  const {
    isExtractingOutline,
    isOutlineOpen,
    outlines,
    hasOutline,
    selectedElementId,
    setSelectedElementId,
    extractOutline,
    toggleOutlinePanel,
  } = useDocumentOutline({
    nodeId: id,
    title: data.title,
    url: data.url,
    initialOutlines: data.outlines,
    initialElements: data.elements,
    initialIsOpen: data.isOutlineOpen,
    onError: () => alert('문서 아웃라인 추출 중 오류가 발생했습니다.'),
  });

  const handleSelectElement = useCallback(
    (elem: DocumentElementItem) => {
      setSelectedElementId(elem.id);
      setActiveElement(elem);
    },
    [setSelectedElementId]
  );

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
  } = useDocumentLayout({
    viewerDefId: viewerDef.id,
    isOutlineOpen: isOutlineOpen && hasOutline,
  });

  // 노드 DOM 크기 변화를 실시간 감지하여 React Flow Handle 위치 캐시를 즉각 갱신
  // React 19 / BatchProvider 렌더 사이클 충돌을 방지하기 위해 반드시 rAF로 다음 프레임에 스케줄링합니다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const safeUpdate = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateNodeInternals(id);
        rafId = null;
      });
    };

    safeUpdate();

    const observer = new ResizeObserver(() => {
      safeUpdate();
    });

    observer.observe(el);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [id, updateNodeInternals]);

  // 패널 토글 시에도 애니메이션 시작 및 완료(320ms) 시점에 안전하게 동기화
  useEffect(() => {
    let rafId: number | null = requestAnimationFrame(() => {
      updateNodeInternals(id);
      rafId = null;
    });

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        updateNodeInternals(id);
      });
    }, 320);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [id, isOutlineOpen, isSpread, isFitContent, customSize, updateNodeInternals]);

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
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ReferenceDocumentCard] Extract scaffold error:', err);
      alert(`[Tiptap 서식 스캐폴딩 추출 오류]\n${msg}`);
    },
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
      ref={containerRef}
      style={containerStyle}
      className={`
        group/node rounded-xl shadow-md border-2 flex flex-col relative [contain:layout_style]
        ${theme.container}
        ${selected ? '!border-indigo-500 shadow-xl ring-2 ring-indigo-400/30 z-30 nowheel' : 'z-10 hover:z-20'}
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
        isExtractingOutline={isExtractingOutline}
        hasOutline={hasOutline}
        isOutlineOpen={isOutlineOpen}
        onToggleFit={onToggleFitWithReset}
        onScan={scan}
        onExtractScaffold={extractScaffold}
        onExtractOutline={() => extractOutline(hasOutline)}
        onToggleOutlinePanel={toggleOutlinePanel}
        onToggleEditMode={toggleEditMode}
        onDelete={handleDelete}
      />

      {/* 본문 컨테이너: 뷰어 본문 + (패널 열림 시) 아웃라인 패널 가로 분할 */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-row relative nodrag nopan">
        {/* 플러그인 뷰어 본문 + 휠 가로채기 래퍼 */}
        <div
          className={`flex-1 w-full h-full overflow-hidden flex flex-col relative ${selected ? 'nowheel' : ''}`}
          onWheel={handleNodeWheel}
        >
          <ViewerComponent
            url={data.url}
            title={data.title}
            isSpread={isSpread}
            segments={segments}
            highlight={highlight}
            isEditMode={isEditMode}
            enableSmartSnap={enableSmartSnap}
            onUpdateSegment={updateSegment}
            onCreateSegment={createSegment}
            onDeleteSegment={deleteSegment}
            onPageCountChange={setPageCount}
            onDimensionsChange={setDimensions}
          />
        </div>

        {/* 아웃라인 & 엘리먼트 트리 패널 */}
        {isOutlineOpen && hasOutline && (
          <DocumentOutlinePanel
            title={data.title}
            outlines={outlines}
            selectedElementId={selectedElementId}
            isRefreshing={isExtractingOutline}
            onSelectElement={handleSelectElement}
            onClose={toggleOutlinePanel}
            onRefresh={() => extractOutline(true)}
          />
        )}
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
