import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
  Terminal,
  Layers,
  Table,
} from 'lucide-react';

import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { type ScaffoldDocumentData } from '@/entities/scaffold-document';
import { useScaffoldFocusStore } from '@/entities/scaffold-document';
import { recipeApi, type RecipeRevision } from '@/entities/recipe';
import { useActiveElementStore } from '@/shared/model';

import { RecipeMatrixView } from './RecipeMatrixView';

/**
 * ScaffoldFocusModal (FSD Feature / Modal UI)
 *
 * Playground의 3단 인터페이스를 캔버스 전체 화면 오버레이로 제공합니다.
 * 좌측: 서식 메타 정보 / 중앙: Tiptap 캔버스 에디터 or 2D Recipe Matrix / 우측: 실시간 MCP 마크다운 연동 뷰
 * 상단: '← 캔버스로 돌아가기' 버튼을 통해 직관적으로 보드로 복귀할 수 있습니다.
 */
interface ScaffoldFocusModalContentProps {
  focusedNodeId: string;
  scaffoldData: ScaffoldDocumentData;
  onClose: () => void;
}

function ScaffoldFocusModalContent({
  focusedNodeId,
  scaffoldData,
  onClose,
}: ScaffoldFocusModalContentProps) {
  const nodes = useCanvasBoardStore((s) => s.nodes);
  const setNodes = useCanvasBoardStore((s) => s.setNodes);
  const selection = useActiveElementStore((s) => s.selection);

  const [viewMode, setViewMode] = useState<'editor' | 'matrix'>('editor');
  const [liveHtml, setLiveHtml] = useState<string>(scaffoldData.htmlContent || '');
  const [liveMarkdown, setLiveMarkdown] = useState<string>(scaffoldData.markdownContent || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [sideTab, setSideTab] = useState<'markdown' | 'recipe'>('markdown');
  const [recipe, setRecipe] = useState<RecipeRevision | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(true);

  // scaffoldId 및 docId를 다양한 출처(노드 데이터, 연결된 원본 카드, 전역 선택 등)로부터 다각도로 식별
  const resolvedScaffoldId = useMemo(() => {
    return (
      scaffoldData.scaffoldId ||
      scaffoldData.archive?.scaffoldId ||
      ((scaffoldData as Record<string, unknown>).archiveId as string | undefined) ||
      selection?.scaffoldId
    );
  }, [scaffoldData, selection?.scaffoldId]);

  const resolvedDocId = useMemo(() => {
    if (typeof scaffoldData.docId === 'string' && scaffoldData.docId) {
      return scaffoldData.docId;
    }
    if (typeof scaffoldData.archive?.docId === 'string' && scaffoldData.archive.docId) {
      return scaffoldData.archive.docId;
    }
    if (selection?.docId) {
      return selection.docId;
    }

    if (scaffoldData.sourceNodeId) {
      const srcNode = nodes.find((n) => n.id === scaffoldData.sourceNodeId);
      const docId = (srcNode?.data as Record<string, unknown> | undefined)?.docId;
      if (typeof docId === 'string' && docId) return docId;
    }

    if (scaffoldData.sourcePdfFileName) {
      const matchingRefNode = nodes.find(
        (n) =>
          n.type === 'referenceDocument' &&
          ((n.data as Record<string, unknown> | undefined)?.fileName === scaffoldData.sourcePdfFileName ||
            (n.data as Record<string, unknown> | undefined)?.title === scaffoldData.sourcePdfFileName)
      );
      const docId = (matchingRefNode?.data as Record<string, unknown> | undefined)?.docId;
      if (typeof docId === 'string' && docId) return docId;
    }

    return undefined;
  }, [scaffoldData, selection?.docId, nodes]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRecipe(true);

    async function loadRecipe() {
      try {
        let found: RecipeRevision | null = null;

        // 1. 문서 ID(docId)로 최우선 조회 (모든 산출물의 정본 앵커)
        if (resolvedDocId) {
          const docItems = await recipeApi.listByDocument(resolvedDocId).catch(() => []);
          if (docItems.length > 0) {
            found = docItems.reduce<RecipeRevision | null>(
              (newest, item) =>
                !newest || item.recipe.provenance.createdAt > newest.provenance.createdAt
                  ? item.recipe
                  : newest,
              null
            );
          }
        }

        // 2. docId로 못 찾았고 scaffoldId가 있으면 scaffoldId로 재조회
        if (!found && resolvedScaffoldId) {
          const scaffoldItems = await recipeApi.listByScaffold(resolvedScaffoldId).catch(() => []);
          if (scaffoldItems.length > 0) {
            found = scaffoldItems.reduce<RecipeRevision | null>(
              (newest, item) =>
                !newest || item.recipe.provenance.createdAt > newest.provenance.createdAt
                  ? item.recipe
                  : newest,
              null
            );
          }
        }

        if (isMounted) {
          setRecipe(found);
        }
      } catch (err) {
        console.error('[ScaffoldFocusModal] Failed to load recipe:', err);
        if (isMounted) setRecipe(null);
      } finally {
        if (isMounted) {
          setIsLoadingRecipe(false);
        }
      }
    }

    void loadRecipe();

    return () => {
      isMounted = false;
    };
  }, [resolvedDocId, resolvedScaffoldId]);

  // 캔버스 복귀 시 노드 데이터 저장
  const handleBackToCanvas = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === focusedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              htmlContent: liveHtml,
              markdownContent: liveMarkdown,
            },
          };
        }
        return n;
      })
    );
    onClose();
  }, [focusedNodeId, liveHtml, liveMarkdown, setNodes, onClose]);

  // ESC 키로 캔버스 돌아가기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackToCanvas();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackToCanvas]);

  const handleCopyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(liveMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [liveMarkdown]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans animate-in fade-in duration-200">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          {/* 5) 캔버스 되돌아가기 버튼 */}
          <button
            onClick={handleBackToCanvas}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-700 transition-all cursor-pointer text-xs font-semibold"
            title="캔버스 보드로 돌아가기 (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>캔버스로 돌아가기</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{scaffoldData.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  Focus Mode
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* 상단 뷰 모드 스위치 (에디터 뷰 ⇄ 저작 규격 Matrix) */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" title="저작 규격(Recipe) 연동 완료" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            실시간 Tiptap 동기화 중
          </span>
        </div>
      </header>

      {/* 2. 본문 3단 레이아웃 (Playground 완벽 재현) */}
      <div className="flex-1 flex overflow-hidden">
        {/* [좌측 패널] 문서 메타 정보 및 서식 가이드 */}
        <aside className="w-72 border-r border-slate-800/80 bg-slate-900/50 p-5 flex flex-col gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              서식 상세 정보
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              원본 문서의 2D 레이아웃을 바탕으로 생성된 Tiptap 와이어프레임입니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">연동 원본</span>
              <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {scaffoldData.sourcePdfFileName || 'PDF 문서'}
              </p>
            </div>
            {scaffoldData.description && (
              <div className="mt-1 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">골격 설명</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {scaffoldData.description}
                </p>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 text-purple-300 text-xs flex flex-col gap-1.5">
            <span className="font-bold flex items-center gap-1.5 text-purple-400 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Tiptap 인라인 슬롯 팁
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
              scaffoldData={scaffoldData}
              docId={resolvedDocId}
              mode="full"
              isLoading={isLoadingRecipe}
              onRecipeUpdated={(up) => setRecipe(up)}
            />
          </main>
        ) : (
          <main className="flex-1 bg-slate-900 p-6 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">와이어프레임 편집 캔버스</h3>
                  <p className="text-[11px] text-slate-400">
                    A4 용지 규격의 Tiptap 다단 그리드 레이아웃
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                💡 수정 즉시 우측 MCP 마크다운과 캔버스 노드에 반영됩니다
              </div>
            </div>

            <div className="w-full max-w-3xl">
              <ScaffoldCanvasEditor
                key={focusedNodeId}
                initialContent={liveHtml}
                onChangeHtml={(html) => setLiveHtml(html)}
                onChangeMarkdown={(md) => setLiveMarkdown(md)}
              />
            </div>
          </main>
        )}

        {/* [우측 패널] 에이전트 / MCP 실시간 마크다운 연동 뷰 or 컴팩트 Recipe Matrix */}
        <aside className="w-80 border-l border-slate-800/80 bg-slate-900/60 p-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>에이전트 MCP Markdown</span>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="마크다운 복사"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? '복사됨!' : '복사'}</span>
            </button>
          </div>
          <div className="mt-3 flex gap-1 rounded-lg bg-slate-800 p-1 text-[10px]">
            <button
              onClick={() => setSideTab('markdown')}
              className={`flex-1 rounded px-2 py-1 ${
                sideTab === 'markdown' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setSideTab('recipe')}
              className={`flex-1 rounded px-2 py-1 ${
                sideTab === 'recipe' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              저작 규격
            </button>
          </div>

          {sideTab === 'markdown' ? (
            <>
              <p className="text-[10px] text-slate-500 my-2">
                에이전트가 MCP 도구로 읽고 쓸 순수 마크다운 데이터입니다.
              </p>
              <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-purple-500/30">
                {liveMarkdown || scaffoldData.markdownContent}
              </div>
            </>
          ) : (
            <div className="mt-3 flex-1 overflow-y-auto pr-1">
              <RecipeMatrixView
                recipe={recipe}
                scaffoldData={scaffoldData}
                docId={resolvedDocId}
                mode="compact"
                isLoading={isLoadingRecipe}
                onRecipeUpdated={(up) => setRecipe(up)}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function ScaffoldFocusModal() {
  const { focusedNodeId, closeFocus } = useScaffoldFocusStore();
  const nodes = useCanvasBoardStore((s) => s.nodes);

  const targetNode = useMemo(
    () => nodes.find((n) => n.id === focusedNodeId),
    [nodes, focusedNodeId]
  );
  const scaffoldData = (targetNode?.data as unknown as ScaffoldDocumentData) || null;

  if (!focusedNodeId || !scaffoldData) {
    return null;
  }

  return (
    <ScaffoldFocusModalContent
      key={focusedNodeId}
      focusedNodeId={focusedNodeId}
      scaffoldData={scaffoldData}
      onClose={closeFocus}
    />
  );
}
