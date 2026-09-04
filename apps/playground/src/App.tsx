import { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  ScaffoldCanvasEditor,
  extractAtticusInvoiceScaffold,
  extractMeetingMinutesScaffold,
  extractBrochureScaffold,
  type DocumentTarget,
  type ScaffoldExtractResult,
} from '@vibe/tiptap-scaffold';

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState<DocumentTarget>('atticus-invoice');
  const [isExtracted, setIsExtracted] = useState<boolean>(true);
  const [liveMarkdown, setLiveMarkdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // 타겟별 추출 결과 캐싱
  const currentScaffold: ScaffoldExtractResult = useMemo(() => {
    switch (selectedTarget) {
      case 'atticus-invoice':
        return extractAtticusInvoiceScaffold();
      case 'meeting-minutes':
        return extractMeetingMinutesScaffold();
      case 'brochure-2408':
        return extractBrochureScaffold();
      default:
        return extractAtticusInvoiceScaffold();
    }
  }, [selectedTarget]);

  // 형식 추출 버튼 클릭
  const handleRunExtract = useCallback(() => {
    setIsExtracted(false);
    setTimeout(() => {
      setIsExtracted(true);
    }, 150);
  }, []);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(liveMarkdown || currentScaffold.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Tiptap Scaffold Lab</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                Port 5174 (Sandbox)
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              내용은 싹 빠진 '틀(Layout + Scaffolding)'만 남아있는 형식 추출 테스트
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vite 5174 격리 환경 가동 중
          </span>
        </div>
      </header>

      {/* 2. 본문 3단 레이아웃 (좌: 문서 선택 / 중: Tiptap 캔버스 에디터 / 우: MCP 마크다운 뷰) */}
      <div className="flex-1 flex overflow-hidden">
        {/* [좌측 패널] 3가지 타겟 문서 선택기 */}
        <aside className="w-72 border-r border-slate-800/80 bg-slate-900/50 p-4 flex flex-col gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              타겟 문서 선택
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              원하는 문서를 선택하고 형식 추출을 실행하세요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* 문서 1: Atticus Invoice (1단계 - 가장 쉬운 사례) */}
            <button
              onClick={() => {
                setSelectedTarget('atticus-invoice');
                handleRunExtract();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTarget === 'atticus-invoice'
                  ? 'bg-purple-600/15 border-purple-500/60 ring-1 ring-purple-500/30 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                  1단계: 가장 쉬운 사례 ⭐
                </span>
                <span className="text-[10px] text-slate-500">1p</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                Atticus LLC_ Invoice 000081709.pdf
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                2단 분할 헤더 + 품목 견적 데이터 표 + 소계/총액
              </p>
            </button>

            {/* 문서 2: 11월 디딤돌 회의록 (2단계 - 복합 표 서식) */}
            <button
              onClick={() => {
                setSelectedTarget('meeting-minutes');
                handleRunExtract();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTarget === 'meeting-minutes'
                  ? 'bg-purple-600/15 border-purple-500/60 ring-1 ring-purple-500/30 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-300">
                  2단계: 행정 표 서식
                </span>
                <span className="text-[10px] text-slate-500">2p</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                11월 디딤돌 회의록.pdf
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                일시/장소/회의내용/영수증부착란 복합 격자 표
              </p>
            </button>

            {/* 문서 3: 2408 문서 (3단계 - 다단 브로셔) */}
            <button
              onClick={() => {
                setSelectedTarget('brochure-2408');
                handleRunExtract();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTarget === 'brochure-2408'
                  ? 'bg-purple-600/15 border-purple-500/60 ring-1 ring-purple-500/30 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300">
                  3단계: 복합 다단 인쇄물
                </span>
                <span className="text-[10px] text-slate-500">고해상도</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                24082026164355-0001.pdf
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                배경 헤더 + 3단 제품특징/원료/용법 블록
              </p>
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800">
            <button
              onClick={handleRunExtract}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>형식(틀) 새로고침 추출</span>
            </button>
          </div>
        </aside>

        {/* [중앙 패널] 캔버스 위의 Tiptap 스캐폴딩 에디터 */}
        <main className="flex-1 bg-slate-900 p-6 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {currentScaffold.meta.title}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {currentScaffold.meta.description}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              💡 보라색 점선 칸을 클릭하여 내용을 직접 입력해보세요
            </div>
          </div>

          <div className="w-full max-w-3xl">
            {isExtracted ? (
              <ScaffoldCanvasEditor
                key={`${selectedTarget}-${currentScaffold.meta.id}`}
                initialContent={currentScaffold.htmlContent}
                onChangeMarkdown={(md) => setLiveMarkdown(md)}
              />
            ) : (
              <div className="w-full h-96 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 gap-2">
                <Sparkles className="w-5 h-5 animate-spin text-purple-400" />
                <span>문서 레이아웃 뼈대 추출 중...</span>
              </div>
            )}
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
            에이전트가 MCP 도구로 읽고 쓸 순수 마크다운 데이터입니다. 에디터에서 수정하면 실시간 반영됩니다.
          </p>

          <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-purple-500/30">
            {liveMarkdown || currentScaffold.markdownContent}
          </div>
        </aside>
      </div>
    </div>
  );
}
