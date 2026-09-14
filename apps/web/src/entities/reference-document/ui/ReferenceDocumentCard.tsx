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
import { requestLlmSettings } from '@/shared/lib/llmSettingsEvent';
import { ProviderExecutionBadge, providerExecutionMessage } from '@/shared/ui';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import { useDocumentLayout } from '../lib/useDocumentLayout';
import { useNodeResize } from '../lib/useNodeResize';
import { useNodeWheelScroll } from '../lib/useNodeWheelScroll';
import { useSegmentEditing } from '../model/useSegmentEditing';
import { useDocumentScaffold } from '../model/useDocumentScaffold';
import { useDocumentOutline } from '../model/useDocumentOutline';
import { useSegmentStructure } from '../model/useSegmentStructure';
import {
  REFERENCE_DOCUMENT_NODE_TYPE,
  type ReferenceDocumentData,
  type DocumentElementItem,
  type DocumentSegmentItem,
} from '../model/types';
import { CardResizeFrame } from './CardResizeFrame';
import { NodeSpreadAnchor } from './NodeSpreadAnchor';
import { ReferenceCardHeader } from './ReferenceCardHeader';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { SegmentStructurePanel } from './SegmentStructurePanel';
import { getReferenceCardTheme } from './referenceCardTheme';

/**
 * 세그먼트 탭이 아닐 때 뷰어에 넘기는 빈 목록.
 *
 * 여기서 `[]` 리터럴을 쓰면 렌더마다 새 배열이 되어 `PdfPage` 의 memo 가 매번
 * 깨진다. 다시 그려진 `<Page>` 는 `onLoadSuccess` 를 또 부르고, 그 콜백이 상태를
 * 바꾸면 렌더가 끝나지 않는다.
 */
const EMPTY_SEGMENTS: DocumentSegmentItem[] = [];

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
  const [panelTab, setPanelTab] = useState<'outline' | 'segments'>('outline');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

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
    outlineProgressStep,
    outlineProgressMessage,
    outlineExecution,
    isOutlineOpen,
    outlines,
    hasOutline,
    selectedElementId,
    outlineError,
    setSelectedElementId,
    extractOutline,
    toggleOutlinePanel,
  } = useDocumentOutline({
    nodeId: id,
    docId: data.docId,
    initialIsOpen: data.isOutlineOpen,
    initialStatus: data.outlineStatus,
    initialError: data.outlineError,
  });

  const {
    structure: segmentStructure,
    isLoading: isLoadingSegmentStructure,
    error: segmentStructureError,
    refresh: refreshSegmentStructure,
    assign: assignSegmentRelationship,
  } = useSegmentStructure(data.docId, isOutlineOpen && panelTab === 'segments');

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
    isOutlineOpen: isOutlineOpen && (hasOutline || isExtractingOutline),
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
    execution: scanExecution,
    isEditMode,
    scan,
    toggleEditMode,
    updateSegment,
    createSegment,
    deleteSegment,
    splitSegment,
    mergeSegments,
  } = useSegmentEditing({
    nodeId: id,
    docId: data.docId,
    onScanSuccess: (loaded) => {
      void refreshSegmentStructure();
      alert(`문서 분석 완료: 총 ${loaded.length}개의 논리 세그먼트(표/목록/섹션)가 감지되었습니다.`);
    },
    onScanError: () => alert('문서 영역 스캔 중 오류가 발생했습니다.'),
    onSegmentSaved: () => void refreshSegmentStructure(),
  });

  const handleSelectSegment = useCallback((segment: { id: string }) => {
    setSelectedSegmentId(segment.id);
  }, []);

  const { isExtractingScaffold, extractScaffold } = useDocumentScaffold({
    nodeId: id,
    docId: data.docId,
    title: data.title,
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
    void (async () => {
      try {
        if (data.docId) await referenceDocumentApi.remove(data.docId);
      } catch (error) {
        // 서버 정리가 실패했어도 캔버스에서 카드를 지울지 사용자에게 묻는 별도
        // 플로우는 다음 UX 개선으로 남긴다. 현재는 고아를 숨기지 않기 위해 기록한다.
        console.error('[ReferenceDocumentCard] 문서 및 세그먼트 정리 실패:', error);
        return;
      }
      setNodes((nds) => nds.filter((node) => node.id !== id));
    })();
  }, [data.docId, id, setNodes]);

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
        isExtractingScaffold={isExtractingScaffold}
        isExtractingOutline={isExtractingOutline}
        hasOutline={hasOutline}
        isOutlineOpen={isOutlineOpen}
        onToggleFit={onToggleFitWithReset}
        onScan={scan}
        onExtractScaffold={extractScaffold}
        onExtractOutline={() => extractOutline(hasOutline)}
        onToggleOutlinePanel={toggleOutlinePanel}
        onDelete={handleDelete}
      />

      {isScanning && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <ProviderExecutionBadge execution={scanExecution} compact />
          <span>{providerExecutionMessage(scanExecution)}</span>
        </div>
      )}

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
            segments={panelTab === 'segments' ? segments : EMPTY_SEGMENTS}
            highlight={highlight}
            selectedSegmentId={selectedSegmentId}
            isEditMode={panelTab === 'segments' && isEditMode}
            enableSmartSnap={enableSmartSnap}
            onUpdateSegment={updateSegment}
            onCreateSegment={createSegment}
            onDeleteSegment={deleteSegment}
            onSplitSegment={splitSegment}
            onSelectSegment={handleSelectSegment}
            onPageCountChange={setPageCount}
            onDimensionsChange={setDimensions}
          />
        </div>

        {/* 아웃라인 & 엘리먼트 트리 패널 */}
        {isOutlineOpen && (hasOutline || isExtractingOutline || segments.length > 0) && (
          <div className="w-[340px] h-full flex flex-col shrink-0">
            <div className="h-8 px-2 flex items-center gap-1 border-l border-b border-slate-200 bg-slate-50 dark:bg-slate-900 nodrag">
              <button
                onClick={() => setPanelTab('outline')}
                className={`px-2 py-1 rounded text-[10px] font-semibold ${panelTab === 'outline' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                Outline
              </button>
              <button
                onClick={() => setPanelTab('segments')}
                className={`px-2 py-1 rounded text-[10px] font-semibold ${panelTab === 'segments' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                Segments
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {panelTab === 'outline' ? (
                <DocumentOutlinePanel
                  title={data.title}
                  outlines={outlines}
                  selectedElementId={selectedElementId}
                  isRefreshing={isExtractingOutline}
                  isExtracting={isExtractingOutline}
                  progressStep={outlineProgressStep}
                  progressMessage={outlineProgressMessage}
                  execution={outlineExecution}
                  onSelectElement={handleSelectElement}
                  onClose={toggleOutlinePanel}
                  onRefresh={() => extractOutline(true)}
                  error={outlineError}
                  onConfigureLlm={requestLlmSettings}
                />
              ) : (
                <SegmentStructurePanel
                  title={data.title}
                  structure={segmentStructure}
                  isLoading={isLoadingSegmentStructure}
                  error={segmentStructureError}
                  selectedSegmentId={selectedSegmentId}
                  isEditMode={isEditMode}
                  onSelectSegment={handleSelectSegment}
                  onSelectElement={handleSelectElement}
                  onAssign={(kind, targetId, segmentId) => void assignSegmentRelationship(kind, targetId, segmentId)}
                  onToggleEdit={toggleEditMode}
                  onMerge={mergeSegments}
                  onClose={toggleOutlinePanel}
                />
              )}
            </div>
          </div>
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
