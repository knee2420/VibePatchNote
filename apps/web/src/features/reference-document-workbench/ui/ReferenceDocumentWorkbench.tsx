import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import {
  Handle,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
  type Node,
} from '@xyflow/react';

import { viewerRegistry, type ViewerHighlight, type ViewerSegment } from '@vibe/document-viewer';

import { useActiveElementStore, useCanvasSettings, useSyncMappingStore } from '@/shared/model';
import { requestLlmSettings } from '@/shared/lib/llmSettingsEvent';
import { ProviderExecutionBadge, providerExecutionMessage } from '@/shared/ui';

import {
  CardResizeFrame,
  DocumentOutlinePanel,
  NodeSpreadAnchor,
  REFERENCE_DOCUMENT_NODE_TYPE,
  ReferenceCardHeader,
  getReferenceCardTheme,
  referenceDocumentApi,
  useDocumentLayout,
  useDocumentOutline,
  useDocumentScaffold,
  useNodeResize,
  useNodeWheelScroll,
  type DocumentElementItem,
  type ReferenceDocumentData,
} from '@/entities/reference-document';
import {
  DOCUMENT_SEGMENT_TYPES,
  SegmentStructureTree,
  fromViewerSegment,
  mergeBlockedMessage,
  planMerge,
  toViewerSegments,
  useSegmentEditing,
  useSegmentStructure,
  type DocumentSegmentItem,
} from '@/entities/document-segment';
import { useRecipeDistill } from '../model/useRecipeDistill';

/**
 * 세그먼트 탭이 아닐 때 뷰어에 넘기는 빈 목록.
 *
 * 여기서 `[]` 리터럴을 쓰면 렌더마다 새 배열이 되어 `PdfPage` 의 memo 가 매번
 * 깨진다. 다시 그려진 `<Page>` 는 `onLoadSuccess` 를 또 부르고, 그 콜백이 상태를
 * 바꾸면 렌더가 끝나지 않는다.
 */
const EMPTY_VIEWER_SEGMENTS: ViewerSegment[] = [];

/** 뷰어 패키지는 문구를 갖지 않는다. 이 앱의 로케일은 호스트가 넘긴다. */
const VIEWER_LABELS = {
  pdfLoadError: 'PDF 문서를 로드하지 못했습니다.',
  pdfLoading: 'PDF 페이지 파싱 중...',
  imageLoadError: '이미지를 로드하지 못했습니다.',
  imageLoading: '이미지 불러오는 중...',
  lazyPageHint: '스크롤 시 자동 로드',
  creatingSegment: '새 영역 생성 중',
  newSegmentLabel: '새 영역 블록',
  editLabelAndType: '라벨/타입 편집 (더블클릭)',
  deleteSegment: '세그먼트 삭제 (Del)',
  splitHorizontal: '가로 분할',
  splitVertical: '세로 분할',
  clearSelection: '선택 해제 (Esc)',
  labelPlaceholder: '라벨 입력...',
  saveLabel: '저장 (Enter)',
  resizeTopLeft: '크기 조절 (좌상단)',
  resizeTopRight: '크기 조절 (우상단)',
  resizeBottomRight: '크기 조절 (우하단)',
  resizeBottomLeft: '크기 조절 (좌하단)',
  resizeTop: '상단 높이 조절',
  resizeBottom: '하단 높이 조절',
  resizeLeft: '좌측 너비 조절',
  resizeRight: '우측 너비 조절',
} as const;

/**
 * ReferenceDocumentWorkbench (FSD Feature UI)
 *
 * 참고 문서 카드의 캔버스 노드 표현. 뷰어 엔진(`@vibe/document-viewer`)에 참고 문서
 * 엔티티와 세그먼트 엔티티를 조합해 크기 핏 / 휠 가로채기 / 펼침 앵커 / 리사이징과
 * 문서 구조 패널을 제공합니다.
 *
 * **엔티티가 아니라 feature 다.** 두 엔티티를 함께 쓰기 때문이다 — 엔티티끼리
 * 직접 참조하면 두 슬라이스가 함께 굳는다.
 * 상태·통신 로직은 전부 훅이 소유하고, 이 컴포넌트는 조합과 렌더링만 담당합니다.
 */
export const ReferenceDocumentWorkbench = memo(function ReferenceDocumentWorkbench({
  id,
  data,
  selected = false,
}: NodeProps<Node<ReferenceDocumentData, typeof REFERENCE_DOCUMENT_NODE_TYPE>>) {
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef<HTMLDivElement>(null);
  const enableSmartSnap = useCanvasSettings((s) => s.enableSmartSnap);
  const activeMapping = useSyncMappingStore((s) => s.activeMapping);

  /**
   * 원본 위 미리보기는 **마우스를 올린 동안만** 켠다.
   *
   * 예전에는 클릭으로 고정됐고 비우는 코드가 없었다. 그래서 한 번 누르면 이 카드의
   * 강조 채널을 영영 점유했고, 와이어프레임 ↔ 원본 동기화 강조가 그 뒤로 전혀
   * 뜨지 않았다. 훑어보는 동작에 영구 상태를 만들면 안 된다.
   */
  const [hoveredElement, setHoveredElement] = useState<DocumentElementItem | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<DocumentSegmentItem | null>(null);
  const [panelTab, setPanelTab] = useState<'outline' | 'segments'>('outline');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  /**
   * 병합 후보는 **선택과 다른 상태**다.
   *
   * 예전에는 트리 안에만 있었고 선택과 같은 색으로 칠해져서, 화면에 셋이 강조돼
   * 있는데 실제로는 둘만 합쳐졌다. 이제 위젯이 들고 있으므로 트리와 PDF 오버레이가
   * 같은 후보 목록을 본다.
   */
  const [mergeCandidateIds, setMergeCandidateIds] = useState<string[]>([]);

  // 이 카드가 해당 매핑의 대상이거나 아웃라인 엘리먼트가 선택되었을 때만 강조한다 (타 카드 번짐 완벽 방지)


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
    resetToAlgorithm: resetSegmentRelationship,
  } = useSegmentStructure(data.docId, isOutlineOpen && panelTab === 'segments');

  /**
   * 원본 위에 그릴 강조들.
   *
   * 아웃라인 항목을 고르면 **그 항목과 소속 세그먼트를 함께** 그린다. 사람은
   * 각주·캡션처럼 영역 밖에 있는 것도 일부러 붙이는데, 고른 것만 그리면 강조가
   * 엉뚱한 데로 튀어 보이고 왜 그런지 알 길이 없다.
   */
  const highlights = useMemo<ViewerHighlight[]>(() => {
    if (hoveredElement?.box_2d) {
      const result: ViewerHighlight[] = [
        {
          id: hoveredElement.id,
          page: hoveredElement.page ?? 1,
          box: hoveredElement.box_2d,
          label: hoveredElement.label,
          variant: 'primary',
        },
      ];

      // **소속 세그먼트는 Segments 탭에서만 보여 준다.**
      // 세그먼트 구조는 한 번 불러오면 상태에 남는다. 탭 조건 없이 쓰면 Segments
      // 탭을 한 번 들렀다는 이유만으로 Outline 탭에도 세그먼트 테두리가 새어 나온다.
      const owner =
        panelTab === 'segments'
          ? segmentStructure?.mappings.find((item) => item.targetId === hoveredElement.id)
              ?.primarySegmentId
          : undefined;
      const ownerSegment = owner
        ? segmentStructure?.segments.find((segment) => segment.id === owner)
        : undefined;
      if (ownerSegment) {
        result.push({
          id: ownerSegment.id,
          page: ownerSegment.page,
          box: ownerSegment.box_2d,
          label: ownerSegment.label,
          variant: 'context',
        });
      }
      return result;
    }

    if (hoveredSegment) {
      return [
        {
          id: hoveredSegment.id,
          page: hoveredSegment.page,
          box: hoveredSegment.box_2d,
          label: hoveredSegment.label,
          variant: 'primary',
        },
      ];
    }

    if (!activeMapping?.box_2d) return [];
    if (activeMapping.targetNodeId) {
      if (activeMapping.targetNodeId !== id) return [];
    } else if (activeMapping.sourcePdfFileName) {
      const isMatchingFile =
        data.title === activeMapping.sourcePdfFileName ||
        (data.url && data.url.includes(encodeURIComponent(activeMapping.sourcePdfFileName))) ||
        (data.url && data.url.includes(activeMapping.sourcePdfFileName));
      if (!isMatchingFile) return [];
    } else {
      return [];
    }

    return [
      {
        id: activeMapping.id,
        page: activeMapping.page ?? 1,
        box: activeMapping.box_2d,
        label: activeMapping.label,
        number: activeMapping.number,
        variant: 'primary',
      },
    ];
  }, [hoveredElement, hoveredSegment, activeMapping, segmentStructure, panelTab, id, data.title, data.url]);

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

  const setSelection = useActiveElementStore((state) => state.setSelection);

  // 노드가 선택될 때 전역 활성 선택 스토어와 동기화
  useEffect(() => {
    if (selected) {
      setSelection({
        nodeId: id,
        nodeType: REFERENCE_DOCUMENT_NODE_TYPE,
        docId: data.docId,
        docTitle: (data.title as string) || (data.fileName as string) || '참조 문서',
        selectedElement: {
          id: data.docId || id,
          label: (data.title as string) || (data.fileName as string) || '참조 문서',
          type: 'document_card',
          sourceFile: (data.fileName as string) || (data.title as string),
          totalPages: pageCount ?? undefined,
          content_summary: `${(data.title as string) || '참조 문서'} 원본 PDF 문서`,
        },
      });
    }
  }, [selected, id, data.docId, data.title, data.fileName, pageCount, setSelection]);

  // 클릭 시 트리 선택 상태와 전역 Element 선택 상태(WinForm 스타일 속성 패널용)를 함께 갱신
  const handleSelectElement = useCallback(
    (elem: DocumentElementItem, event?: React.MouseEvent) => {
      setSelectedElementId(elem.id);
      const elemEl = document.querySelector(`[data-element-id="${elem.id}"]`);
      const rect = elemEl?.getBoundingClientRect();
      const anchorPos = event
        ? { clientX: event.clientX, clientY: event.clientY }
        : rect
        ? { clientX: rect.left + rect.width / 2, clientY: rect.top }
        : undefined;

      setSelection({
        nodeId: id,
        nodeType: REFERENCE_DOCUMENT_NODE_TYPE,
        docId: data.docId,
        docTitle: (data.title as string) || (data.fileName as string) || '참조 문서',
        selectedElement: {
          id: elem.id,
          label: elem.label,
          type: elem.type,
          page: elem.page,
          box_2d: elem.box_2d,
          content_summary: elem.content_summary,
          outline_id: elem.outline_id,
          anchorPos,
        },
      });
    },
    [id, data.docId, data.title, data.fileName, setSelection, setSelectedElementId]
  );

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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSegmentEditing({
    nodeId: id,
    docId: data.docId,
    onScanSuccess: (loaded) => {
      void refreshSegmentStructure();
      alert(`문서 분석 완료: 총 ${loaded.length}개의 논리 세그먼트(표/목록/섹션)가 감지되었습니다.`);
    },
    onScanError: () => alert('문서 영역 스캔 중 오류가 발생했습니다.'),
    onSegmentSaved: () => void refreshSegmentStructure(),
    onMergeBlocked: (reason) => alert(mergeBlockedMessage(reason)),
  });

  // 뷰어는 호스트 중립 계약을 쓴다. 백엔드 DTO 를 그대로 넘기지 않고 경계에서 바꾼다.
  const viewerSegments = useMemo(
    () => (panelTab === 'segments' ? toViewerSegments(segments) : EMPTY_VIEWER_SEGMENTS),
    [panelTab, segments]
  );
  const handleViewerUpdate = useCallback(
    (updated: ViewerSegment) => updateSegment(fromViewerSegment(updated)),
    [updateSegment]
  );
  const handleViewerCreate = useCallback(
    (created: ViewerSegment) => createSegment(fromViewerSegment(created)),
    [createSegment]
  );

  /** 지금 후보로 병합하면 어떻게 되는지. 미리보기와 실행이 같은 계산을 쓴다. */
  const mergePreview = useMemo(
    () => planMerge(segments, mergeCandidateIds),
    [segments, mergeCandidateIds]
  );

  const toggleMergeCandidate = useCallback((segmentId: string) => {
    setMergeCandidateIds((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
  }, []);

  const runMerge = useCallback(() => {
    // 합쳐진 세그먼트는 첫 후보의 자리에 남는다. 그걸 선택해 두면 라벨을 바로
    // 고칠 수 있다 — 합친 결과의 이름은 대개 원래 것 중 하나가 아니다.
    const mergedId = mergeCandidateIds[0] ?? null;
    mergeSegments(mergeCandidateIds);
    setMergeCandidateIds([]);
    if (mergedId) setSelectedSegmentId(mergedId);
  }, [mergeSegments, mergeCandidateIds]);

  // 편집 모드를 벗어나면 후보도 비운다. 남아 있으면 다음에 들어왔을 때
  // 의도하지 않은 것들이 이미 골라져 있다.
  useEffect(() => {
    if (!isEditMode) setMergeCandidateIds([]);
  }, [isEditMode]);

  // 탭을 옮기면 이전 탭에서 올려 둔 미리보기를 비운다. 마우스가 패널 밖으로
  // 나가지 않은 채 탭만 바뀌면 `onMouseLeave` 가 오지 않아 강조가 남는다.
  useEffect(() => {
    setHoveredElement(null);
    setHoveredSegment(null);
  }, [panelTab]);

  // 되돌리기 단축키. 입력 중에는 브라우저 기본 동작(텍스트 되돌리기)을 막지 않는다.
  useEffect(() => {
    if (!isEditMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isEditMode, undo, redo]);

  const handleSelectSegment = useCallback(
    (segment: DocumentSegmentItem | ViewerSegment) => {
      const item: DocumentSegmentItem = 'box_2d' in segment ? segment : fromViewerSegment(segment);
      setSelectedSegmentId(item.id);

      const segEl = document.querySelector(`[data-segment-id="${item.id}"]`);
      const rect = segEl?.getBoundingClientRect();
      const anchorPos = rect
        ? { clientX: rect.left + rect.width / 2, clientY: rect.top }
        : undefined;

      setSelection({
        nodeId: id,
        nodeType: REFERENCE_DOCUMENT_NODE_TYPE,
        docId: data.docId,
        docTitle: (data.title as string) || (data.fileName as string) || '참조 문서',
        selectedElement: {
          id: item.id,
          label: item.label || `세그먼트 ${item.id}`,
          type: 'document_segment',
          segmentType: item.type,
          page: item.page,
          box_2d: item.box_2d,
          content_summary: item.content_summary,
          purpose: `논리 세그먼트 (${item.type})`,
          structured_data: {
            segmentType: item.type,
          },
          anchorPos,
        },
      });
    },
    [id, data.docId, data.title, data.fileName, setSelection, setSelectedSegmentId]
  );

  const { isExtractingScaffold, extractScaffold } = useDocumentScaffold({
    nodeId: id,
    docId: data.docId,
    title: data.title,
    onSuccess: (scaffoldTitle) =>
      alert(`스캐폴딩 추출 완료: [${scaffoldTitle}] 노드가 캔버스에 연결되었습니다.`),
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ReferenceDocumentWorkbench] Extract scaffold error:', err);
      alert(`[Tiptap 서식 스캐폴딩 추출 오류]\n${msg}`);
    },
  });
  const onRecipeError = useCallback((msg: string) => {
    console.error('[ReferenceDocumentWorkbench] Recipe distill error:', msg);
    alert(`[저작 규격 추출 오류]\n${msg}`);
  }, []);
  const onRecipeDone = useCallback(
    (blockCount: number) =>
      alert(`저작 규격 추출 완료: 총 ${blockCount}개의 작성 블록이 정리되었습니다.`),
    [],
  );
  const recipe = useRecipeDistill(data.docId, onRecipeError, onRecipeDone);

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
        console.error('[ReferenceDocumentWorkbench] 문서 및 세그먼트 정리 실패:', error);
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
        extraActions={<button
          onClick={(event) => { event.stopPropagation(); void recipe.start(); }}
          disabled={!recipe.isReady || recipe.isRunning}
          className={`p-1.5 rounded-md nodrag flex items-center justify-center ${recipe.isReady ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-300 bg-slate-50 cursor-not-allowed'}`}
          title={recipe.isRunning ? '저작 규격 추출 중...' : recipe.isReady ? '저작 규격 초안 추출' : `추출 조건 누락: ${recipe.missing.join(', ')}`}
          aria-label="저작 규격 초안 추출"
        >{recipe.isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}</button>}
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
            segments={viewerSegments}
            segmentTypes={DOCUMENT_SEGMENT_TYPES}
            labels={VIEWER_LABELS}
            mergeCandidateIds={mergeCandidateIds}
            absorbedSegmentIds={mergePreview.absorbedIds}
            mergePreviewBox={mergePreview.box}
            onToggleMergeCandidate={toggleMergeCandidate}
            highlights={highlights}
            selectedSegmentId={selectedSegmentId}
            isEditMode={panelTab === 'segments' && isEditMode}
            enableSmartSnap={enableSmartSnap}
            onUpdateSegment={handleViewerUpdate}
            onCreateSegment={handleViewerCreate}
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
                  onHoverElement={setHoveredElement}
                  onClose={toggleOutlinePanel}
                  onRefresh={() => extractOutline(true)}
                  error={outlineError}
                  onConfigureLlm={requestLlmSettings}
                />
              ) : (
                <SegmentStructureTree
                  title={data.title}
                  structure={segmentStructure}
                  isLoading={isLoadingSegmentStructure}
                  error={segmentStructureError}
                  selectedSegmentId={selectedSegmentId}
                  isEditMode={isEditMode}
                  mergeCandidateIds={mergeCandidateIds}
                  absorbedSegmentIds={mergePreview.absorbedIds}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onSelectSegment={handleSelectSegment}
                  onSelectElement={handleSelectElement}
                  onHoverElement={setHoveredElement}
                  onHoverSegment={setHoveredSegment}
                  onToggleMergeCandidate={toggleMergeCandidate}
                  onAssign={(kind, targetId, segmentId) => void assignSegmentRelationship(kind, targetId, segmentId)}
                  onResetRelationship={(kind, targetId) => void resetSegmentRelationship(kind, targetId)}
                  onToggleEdit={toggleEditMode}
                  onMerge={runMerge}
                  onUndo={undo}
                  onRedo={redo}
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
