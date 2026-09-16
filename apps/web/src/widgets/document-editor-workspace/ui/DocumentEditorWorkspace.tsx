import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Table,
  Sparkles,
  AlertCircle,
  LayoutGrid,
  FileSpreadsheet,
  Layers,
  History,
  TableProperties,
  Target,
} from 'lucide-react';

import {
  WorkspaceShell,
  TopMenuBar,
  SyncStatusBadge,
  WorkspacePanel,
  BinderToolbar,
  BinderTree,
  CorkboardView,
  OutlinerTable,
  SnapshotInspector,
  MetadataInspector,
  DocumentCompilerModal,
  BreadcrumbBar,
  WordCountBadge,
  PaginationBar,
  PagedCanvasContainer,
  QuickTabSwitcher,
  type BinderItem,
  type CorkboardCard,
  type OutlinerRow,
  type DocumentSnapshot,
  type DocumentMetadata,
  type CompilerSection,
  type CompilerOptions,
  type BreadcrumbItem,
  type SyncStatusType,
  type PageLayoutMode,
  type QuickTabItem,
} from '@vibe/editor-workspace';

import { useScaffoldDocumentDetail, type ScaffoldDocumentData } from '@/entities/scaffold-document';
import { useScaffoldRecipe } from '@/entities/recipe';
import { DocumentWireframeEditor } from '@/features/document-wireframe-editor';
import { RecipeMatrixView } from '@/features/recipe-matrix-view';
import { McpMarkdownPanel } from '@/features/mcp-markdown-sync';

interface DocumentEditorWorkspaceProps {
  scaffoldId: string;
  onBack?: () => void;
}

type EditorViewMode = 'editor' | 'matrix' | 'corkboard' | 'outliner';
type InspectorTab = 'mcp' | 'meta' | 'snapshots' | 'matrix';

/**
 * DocumentEditorWorkspace (Widget)
 *
 * @vibe/editor-workspace 모듈형 엔진으로 구축된 고도화된 문서 편집 상세 워크스페이스.
 * - 상단: TopMenuBar + QuickTabSwitcher (단축키 Ctrl+1~4 지원) + SyncStatusBadge + 컴파일러
 * - 좌측: WorkspacePanel + BinderToolbar + BinderTree (슬롯/섹션 네비게이션)
 * - 중앙: 에디터 캔버스(A4 낱장 / 연속 / 양면 펼침 / 젠 모드) ⇄ 2D 규격 Matrix ⇄ 코르크보드 ⇄ 아웃라이너
 * - 우측: 4단 인스펙터 (MCP 마크다운 / 메타데이터&목표진행도 / 세그먼트 스냅샷 / 저작 규격)
 * - 하단: BreadcrumbBar + PaginationBar (페이지 점프 및 줌) + WordCountBadge 실시간 상태바
 */
export function DocumentEditorWorkspace({
  scaffoldId,
  onBack,
}: DocumentEditorWorkspaceProps) {
  const [viewMode, setViewMode] = useState<EditorViewMode>('editor');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('mcp');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);

  // 문서 뷰 형태 (페이지네이션 레이아웃 & 줌) 상태
  const [layoutMode, setLayoutMode] = useState<PageLayoutMode>('continuous');
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 메타데이터 및 목표 분량 상태
  const [docMetadata, setDocMetadata] = useState<DocumentMetadata>({
    status: '작성중',
    label: '기본',
    targetWordCount: 3000,
    tags: ['스캐폴드', '정본서식'],
    notes: '',
  });

  // 로컬 스냅샷 메모리 상태 (세그먼트 복원점 관리)
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);

  const {
    detail,
    isLoading: isLoadingDetail,
    error: detailError,
    syncState,
    liveHtml,
    liveMarkdown,
    setLiveHtml,
    setLiveMarkdown,
  } = useScaffoldDocumentDetail(scaffoldId);

  const resolvedDocId = detail?.docId;
  const { recipe, isLoading: isLoadingRecipe, setRecipe } = useScaffoldRecipe(
    scaffoldId,
    resolvedDocId
  );

  // 총 페이지 수 계산
  const totalPages = Math.max(1, detail?.slots?.length || 1);

  // 글자 수 및 단어 수 통계
  const charCount = liveMarkdown.length;
  const wordCount = useMemo(() => {
    return liveMarkdown.trim() ? liveMarkdown.trim().split(/\s+/).length : 0;
  }, [liveMarkdown]);

  // RecipeMatrixView에 전달할 최소 ScaffoldDocumentData 어댑터
  const matrixScaffoldData: ScaffoldDocumentData = useMemo(() => {
    return {
      id: scaffoldId,
      title: detail?.title || '와이어프레임 서식',
      description: detail?.description,
      scaffoldId,
      docId: detail?.docId,
      slots: detail?.slots || [],
      htmlContent: liveHtml,
      markdownContent: liveMarkdown,
    };
  }, [detail, scaffoldId, liveHtml, liveMarkdown]);

  // 4대 뷰 모드 탭 목록 (QuickTabSwitcher 연동: Ctrl+1~4 단축키 자동 지원)
  const viewTabs: QuickTabItem[] = useMemo(() => [
    {
      id: 'editor',
      label: '에디터 캔버스',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'matrix',
      label: '저작 규격 Matrix',
      icon: <Table className="w-3.5 h-3.5" />,
      badge: recipe ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> : undefined,
    },
    {
      id: 'corkboard',
      label: '코르크보드 2D',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: 'outliner',
      label: '아웃라이너',
      icon: <TableProperties className="w-3.5 h-3.5" />,
    },
  ], [recipe]);

  // 바인더 트리 데이터
  const binderItems: BinderItem[] = useMemo(() => {
    if (!detail?.slots || detail.slots.length === 0) {
      return [
        {
          id: scaffoldId,
          name: detail?.title || '기본 본문 섹션',
          isFolder: false,
        },
      ];
    }
    return [
      {
        id: 'root-document',
        name: detail.title || '문서 섹션 구조',
        isFolder: true,
        children: detail.slots.map((slot) => ({
          id: slot.id,
          name: slot.label || `슬롯 #${slot.number}`,
          isFolder: false,
          data: { number: slot.number, pageNumber: slot.pageNumber },
        })),
      },
    ];
  }, [detail, scaffoldId]);

  // 코르크보드 카드 데이터
  const corkboardCards: CorkboardCard[] = useMemo(() => {
    if (!detail?.slots || detail.slots.length === 0) {
      return [
        {
          id: scaffoldId,
          title: detail?.title || '메인 본문',
          synopsis: detail?.description || '본문 콘텐츠 전체 영역입니다.',
          status: '초안',
          labelColor: '#a855f7',
        },
      ];
    }
    return detail.slots.map((slot) => ({
      id: slot.id,
      title: slot.label || `슬롯 #${slot.number}`,
      synopsis: slot.pageNumber
        ? `페이지 ${slot.pageNumber} 서식 영역 (No. ${slot.number})`
        : `서식 영역 (No. ${slot.number})`,
      status: `No. ${slot.number}`,
      labelColor: '#a855f7',
    }));
  }, [detail, scaffoldId]);

  // 아웃라이너 테이블 행 데이터
  const outlinerRows: OutlinerRow[] = useMemo(() => {
    if (!detail?.slots || detail.slots.length === 0) {
      return [
        {
          id: scaffoldId,
          number: 1,
          title: detail?.title || '메인 본문',
          synopsis: detail?.description || '전체 문서 영역',
          wordCount: charCount,
          status: docMetadata.status,
          label: docMetadata.label,
        },
      ];
    }
    const perSlotWords = Math.round(charCount / (detail.slots.length || 1));
    return detail.slots.map((slot) => ({
      id: slot.id,
      number: slot.number,
      title: slot.label || `슬롯 #${slot.number}`,
      synopsis: slot.pageNumber
        ? `페이지 ${slot.pageNumber} 영역 (No. ${slot.number})`
        : `서식 영역 #${slot.number}`,
      wordCount: perSlotWords,
      status: docMetadata.status,
      label: docMetadata.label,
    }));
  }, [detail, scaffoldId, charCount, docMetadata.status, docMetadata.label]);

  // 컴파일러용 섹션 데이터
  const compilerSections: CompilerSection[] = useMemo(() => {
    if (!detail?.slots || detail.slots.length === 0) {
      return [
        {
          id: scaffoldId,
          title: detail?.title || '전체 본문',
          depth: 0,
          selected: true,
          contentLength: charCount,
        },
      ];
    }
    return detail.slots.map((slot) => ({
      id: slot.id,
      title: slot.label || `섹션 #${slot.number}`,
      depth: 1,
      selected: true,
      contentLength: Math.round(charCount / (detail.slots.length || 1)),
    }));
  }, [detail, scaffoldId, charCount]);

  // 브레드크럼 경로 항목
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { id: 'home', label: '서식 보관함' },
      { id: 'doc', label: detail?.title || '문서 상세' },
    ];
    if (selectedSlotId) {
      const matched = detail?.slots?.find((s) => s.id === selectedSlotId);
      if (matched) {
        items.push({
          id: matched.id,
          label: matched.label || `슬롯 #${matched.number}`,
        });
      }
    }
    return items;
  }, [detail, selectedSlotId]);

  // 스냅샷 생성 핸들러
  const handleTakeSnapshot = () => {
    const newSnapshot: DocumentSnapshot = {
      id: `snap-${Date.now()}`,
      title: `${detail?.title || '본문'} 스냅샷 #${snapshots.length + 1}`,
      timestamp: Date.now(),
      previewText: liveMarkdown.slice(0, 120) || '내용 없음',
      fullContent: liveMarkdown,
    };
    setSnapshots([newSnapshot, ...snapshots]);
  };

  // 스냅샷 복원 핸들러
  const handleRestoreSnapshot = (snap: DocumentSnapshot) => {
    if (snap.fullContent) {
      setLiveMarkdown(snap.fullContent);
      setLiveHtml(`<p>${snap.fullContent.replace(/\n/g, '<br/>')}</p>`);
    }
  };

  // 컴파일 실행 핸들러
  const handleCompile = (_options: CompilerOptions, selectedIds: string[]) => {
    const compiledText = `# ${detail?.title || '합성 문서'}\n\n` +
      `> 컴파일 일시: ${new Date().toLocaleString()} (선택된 섹션: ${selectedIds.length}개)\n\n` +
      liveMarkdown;

    const blob = new Blob([compiledText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail?.title || 'document'}-compiled.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsCompilerOpen(false);
  };

  const syncStatus: SyncStatusType =
    syncState === 'saving'
      ? 'saving'
      : syncState === 'saved'
      ? 'saved'
      : syncState === 'error'
      ? 'error'
      : 'idle';

  if (isLoadingDetail) {
    return (
      <div className="w-full h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-700">서식 보관함에서 문서를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (detailError || !detail) {
    return (
      <div className="w-full h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700 gap-4 p-6">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-base font-bold text-slate-900 mb-1">문서를 불러올 수 없습니다</h3>
          <p className="text-xs text-slate-500">
            {detailError?.message || `스캐폴드 ID [${scaffoldId}]에 해당하는 보관본을 찾지 못했습니다.`}
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>캔버스 보드로 돌아가기</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <WorkspaceShell
        showSidebar={layoutMode !== 'zen'}
        showInspector={layoutMode !== 'zen'}
        /* 1. 상단 글로벌 탑 메뉴바 */
        header={
          <TopMenuBar
            leftSlot={
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs transition cursor-pointer text-xs font-semibold"
                    title="캔버스 보드로 돌아가기"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>캔버스</span>
                  </button>
                )}
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                    <span>{detail.title || '문서 상세 편집'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono border border-indigo-200/80 font-medium">
                      SSOT
                    </span>
                  </h2>
                </div>
              </div>
            }
            centerSlot={
              <QuickTabSwitcher
                tabs={viewTabs}
                activeId={viewMode}
                onChange={(id) => setViewMode(id as EditorViewMode)}
                showShortcutHints={true}
              />
            }
            rightSlot={
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCompilerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer text-xs font-semibold"
                  title="바인더 섹션 합성 및 출력"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>문서 합성</span>
                </button>
                <SyncStatusBadge status={syncStatus} />
              </div>
            }
          />
        }
        /* 2. 좌측 바인더 탐색 패널 */
        sidebar={
          <WorkspacePanel
            title="문서 바인더"
            subtitle="서식 섹션 트리"
            actions={
              <span className="text-[10px] font-mono text-indigo-700 font-semibold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80">
                {detail.slots?.length || 0} Slots
              </span>
            }
            toolbar={
              <BinderToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            }
          >
            <div className="p-2 flex flex-col gap-3">
              <BinderTree
                data={binderItems}
                searchTerm={searchTerm}
                selectedId={selectedSlotId}
                onSelect={(item) => setSelectedSlotId(item ? item.id : null)}
                height={280}
              />

              {/* 서식 골격 요약 카드 */}
              <div className="mt-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>인라인 스캐폴드 슬롯</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  슬롯 테두리 칸을 클릭하여 실제 서식 본문을 채워 넣으세요.
                </p>
              </div>
            </div>
          </WorkspacePanel>
        }
        /* 3. 우측 다기능 인스펙터 패널 */
        inspector={
          <WorkspacePanel
            title="속성 & 관측 인스펙터"
            toolbar={
              <div className="flex items-center gap-1 p-1 bg-slate-100 border-b border-slate-200 w-full text-xs">
                <button
                  type="button"
                  onClick={() => setInspectorTab('mcp')}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[10px] ${
                    inspectorTab === 'mcp'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  MCP 마크다운
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('meta')}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[10px] flex items-center justify-center gap-1 ${
                    inspectorTab === 'meta'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <Target className="w-3 h-3 text-indigo-600" />
                  <span>메타데이터</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('snapshots')}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[10px] flex items-center justify-center gap-1 ${
                    inspectorTab === 'snapshots'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <History className="w-3 h-3 text-indigo-600" />
                  <span>스냅샷 ({snapshots.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('matrix')}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[10px] ${
                    inspectorTab === 'matrix'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  저작 규격
                </button>
              </div>
            }
          >
            {inspectorTab === 'mcp' && (
              <McpMarkdownPanel
                markdown={liveMarkdown}
                extraTabLabel="저작 규격"
                renderExtraTab={() => (
                  <RecipeMatrixView
                    recipe={recipe}
                    scaffoldData={matrixScaffoldData}
                    docId={resolvedDocId}
                    mode="compact"
                    isLoading={isLoadingRecipe}
                    onRecipeUpdated={(up) => setRecipe(up)}
                  />
                )}
              />
            )}

            {inspectorTab === 'meta' && (
              <MetadataInspector
                metadata={{
                  ...docMetadata,
                  currentWordCount: charCount,
                }}
                onChange={(up) => setDocMetadata(up)}
              />
            )}

            {inspectorTab === 'snapshots' && (
              <SnapshotInspector
                snapshots={snapshots}
                currentContent={liveMarkdown}
                onTakeSnapshot={handleTakeSnapshot}
                onRestoreSnapshot={handleRestoreSnapshot}
                onDeleteSnapshot={(id) => setSnapshots(snapshots.filter((s) => s.id !== id))}
              />
            )}

            {inspectorTab === 'matrix' && (
              <div className="p-3 h-full overflow-y-auto">
                <RecipeMatrixView
                  recipe={recipe}
                  scaffoldData={matrixScaffoldData}
                  docId={resolvedDocId}
                  mode="compact"
                  isLoading={isLoadingRecipe}
                  onRecipeUpdated={(up) => setRecipe(up)}
                />
              </div>
            )}
          </WorkspacePanel>
        }
        /* 4. 하단 고도화 상태바 (Breadcrumb + PaginationBar + WordCount) */
        statusBar={
          <div className="h-7 px-4 flex items-center justify-between text-[11px] text-slate-500 bg-white">
            {/* 좌측 브레드크럼 네비게이터 */}
            <BreadcrumbBar
              items={breadcrumbItems}
              onSelect={(item) => setSelectedSlotId(item.id === 'doc' || item.id === 'home' ? null : item.id)}
            />

            {/* 중앙 페이지네이션 & 뷰 레이아웃 컨트롤러 (연속/A4/양면/젠 & 줌 배율) */}
            {viewMode === 'editor' && (
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                zoom={zoom}
                layoutMode={layoutMode}
                onPageChange={setCurrentPage}
                onZoomChange={setZoom}
                onLayoutModeChange={setLayoutMode}
              />
            )}

            {/* 우측 실시간 분량 통계 & 뷰 모드 배지 */}
            <div className="flex items-center gap-4">
              <WordCountBadge
                charCount={charCount}
                wordCount={wordCount}
                targetCount={docMetadata.targetWordCount}
              />
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 text-slate-600">
                <Layers className="w-3 h-3 text-indigo-600" />
                <span className="capitalize">{viewMode}</span>
              </div>
            </div>
          </div>
        }
      >
        {/* 5. 중앙 메인 뷰포트 (선택된 4대 뷰 모드에 따라 전환) */}
        {viewMode === 'editor' && (
          <PagedCanvasContainer
            layoutMode={layoutMode}
            zoom={zoom}
            currentPage={currentPage}
            totalPages={totalPages}
          >
            <DocumentWireframeEditor
              documentKey={scaffoldId}
              initialHtml={liveHtml}
              onChangeHtml={(html) => setLiveHtml(html)}
              onChangeMarkdown={(md) => setLiveMarkdown(md)}
            />
          </PagedCanvasContainer>
        )}

        {viewMode === 'matrix' && (
          <div className="flex-1 h-full bg-slate-100/70 p-8 overflow-y-auto">
            <RecipeMatrixView
              recipe={recipe}
              scaffoldData={matrixScaffoldData}
              docId={resolvedDocId}
              mode="full"
              isLoading={isLoadingRecipe}
              onRecipeUpdated={(up) => setRecipe(up)}
            />
          </div>
        )}

        {viewMode === 'corkboard' && (
          <div className="flex-1 h-full">
            <CorkboardView
              cards={corkboardCards}
              selectedId={selectedSlotId}
              onSelect={(card) => setSelectedSlotId(card.id)}
            />
          </div>
        )}

        {viewMode === 'outliner' && (
          <div className="flex-1 h-full">
            <OutlinerTable
              rows={outlinerRows}
              selectedId={selectedSlotId}
              onSelect={(row) => setSelectedSlotId(row.id)}
            />
          </div>
        )}
      </WorkspaceShell>

      {/* 6. 복합 문서 컴파일러 모달 */}
      {isCompilerOpen && (
        <DocumentCompilerModal
          sections={compilerSections}
          onToggleSection={(_id, _sel) => {}}
          onToggleAll={(_sel) => {}}
          onCompile={handleCompile}
          onClose={() => setIsCompilerOpen(false)}
        />
      )}
    </>
  );
}
