import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  Table,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

import { useScaffoldDocumentDetail, type ScaffoldDocumentData } from '@/entities/scaffold-document';
import { useScaffoldRecipe } from '@/entities/recipe';
import { DocumentWireframeEditor } from '@/features/document-wireframe-editor';
import { RecipeMatrixView } from '@/features/recipe-matrix-view';
import { McpMarkdownPanel } from '@/features/mcp-markdown-sync';

interface DocumentEditorWorkspaceProps {
  scaffoldId: string;
  onBack?: () => void;
}

/**
 * DocumentEditorWorkspace (Widget)
 *
 * 승격된 독립 에디터 상세 편집 워크스페이스 위젯.
 * 좌측: 서식 메타 정보 / 중앙: Tiptap 캔버스 에디터 or 2D Recipe Matrix / 우측: 실시간 MCP 마크다운 연동 뷰
 * 백엔드 스캐폴드 아카이브(SSOT) 및 Recipe와 실시간 양방향 동기화됩니다.
 */
export function DocumentEditorWorkspace({
  scaffoldId,
  onBack,
}: DocumentEditorWorkspaceProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'matrix'>('editor');

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

  if (isLoadingDetail) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm font-medium">서식 보관함에서 문서를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (detailError || !detail) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4 p-6">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-base font-bold text-white mb-1">문서를 불러올 수 없습니다</h3>
          <p className="text-xs text-slate-400">
            {detailError?.message || `스캐폴드 ID [${scaffoldId}]에 해당하는 보관본을 찾지 못했습니다.`}
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>캔버스 보드로 돌아가기</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-700 transition-all cursor-pointer text-xs font-semibold"
              title="캔버스 보드로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>캔버스로 돌아가기</span>
            </button>
          )}

          {onBack && <div className="h-4 w-px bg-slate-800" />}

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{detail.title || '문서 상세 편집'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  Workspace
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* 중앙 뷰 모드 스위치 (에디터 뷰 ⇄ 저작 규격 Matrix) */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>에디터 캔버스</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>저작 규격 Matrix</span>
            {recipe && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs"
                title="저작 규격(Recipe) 연동 완료"
              />
            )}
          </button>
        </div>

        {/* 우측 동기화 상태 인디케이터 */}
        <div className="flex items-center gap-3 text-xs">
          {syncState === 'saving' && (
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              아카이브 저장 중...
            </span>
          )}
          {syncState === 'saved' && (
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              보관함 저장 완료
            </span>
          )}
          {syncState === 'idle' && (
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              실시간 동기화 대기
            </span>
          )}
          {syncState === 'error' && (
            <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              동기화 오류
            </span>
          )}
        </div>
      </header>

      {/* 2. 본문 3단 레이아웃 */}
      <div className="flex-1 flex overflow-hidden">
        {/* [좌측 사이드 패널] 문서 메타 정보 및 서식 가이드 */}
        <aside className="w-72 border-r border-slate-800/80 bg-slate-900/50 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              서식 상세 정보
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              백엔드 아카이브에 영속화된 정본 와이어프레임입니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">식별자 (ID)</span>
              <p className="text-xs font-mono text-slate-200 truncate mt-0.5" title={scaffoldId}>
                {scaffoldId}
              </p>
            </div>
            {detail.docId && (
              <div className="mt-1 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">문서 앵커 ID</span>
                <p className="text-xs font-mono text-slate-300 truncate mt-0.5">
                  {detail.docId}
                </p>
              </div>
            )}
            {detail.description && (
              <div className="mt-1 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">골격 설명</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {detail.description}
                </p>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 text-purple-300 text-xs flex flex-col gap-1.5">
            <span className="font-bold flex items-center gap-1.5 text-purple-400 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Tiptap 인라인 슬롯 편집
            </span>
            <p className="text-[11px] text-purple-300/80 leading-relaxed">
              보라색 점선 테두리 칸을 클릭하여 실제 본문 내용을 직접 입력하고 채워 넣으세요.
            </p>
          </div>
        </aside>

        {/* [중앙 패널] 뷰 모드에 따른 분기 (A4 에디터 캔버스 or 2D Recipe Matrix) */}
        {viewMode === 'matrix' ? (
          <main className="flex-1 bg-slate-900 p-8 overflow-y-auto">
            <RecipeMatrixView
              recipe={recipe}
              scaffoldData={matrixScaffoldData}
              docId={resolvedDocId}
              mode="full"
              isLoading={isLoadingRecipe}
              onRecipeUpdated={(up) => setRecipe(up)}
            />
          </main>
        ) : (
          <main className="flex-1 bg-slate-900 p-6 overflow-y-auto flex flex-col items-center">
            <DocumentWireframeEditor
              documentKey={scaffoldId}
              initialHtml={liveHtml}
              onChangeHtml={(html) => setLiveHtml(html)}
              onChangeMarkdown={(md) => setLiveMarkdown(md)}
            />
          </main>
        )}

        {/* [우측 패널] MCP 실시간 마크다운 연동 뷰 */}
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
      </div>
    </div>
  );
}
