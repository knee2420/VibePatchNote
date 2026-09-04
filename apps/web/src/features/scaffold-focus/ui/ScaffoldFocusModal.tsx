import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
  Terminal,
  Layers,
} from 'lucide-react';

import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { type ScaffoldDocumentData } from '@/entities/scaffold-document';
import { useScaffoldFocusStore } from '@/shared/model';

/**
 * ScaffoldFocusModal (FSD Feature / Modal UI)
 *
 * Playground의 3단 인터페이스를 캔버스 전체 화면 오버레이로 제공합니다.
 * 좌측: 서식 메타 정보 / 중앙: Tiptap 캔버스 에디터 / 우측: 실시간 MCP 마크다운 연동 뷰
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
  const setNodes = useCanvasBoardStore((s) => s.setNodes);

  const [liveHtml, setLiveHtml] = useState<string>(scaffoldData.htmlContent || '');
  const [liveMarkdown, setLiveMarkdown] = useState<string>(scaffoldData.markdownContent || '');
  const [copied, setCopied] = useState<boolean>(false);

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

        {/* [중앙 패널] Tiptap 캔버스 에디터 대형 A4 뷰 */}
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

        {/* [우측 패널] 에이전트 / MCP 실시간 마크다운 연동 뷰 */}
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

          <p className="text-[10px] text-slate-500 my-2">
            에이전트가 MCP 도구로 읽고 쓸 순수 마크다운 데이터입니다.
          </p>

          <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-purple-500/30">
            {liveMarkdown || scaffoldData.markdownContent}
          </div>
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
