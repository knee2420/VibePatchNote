import { memo, useCallback, useMemo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import {
  FileText,
  Maximize2,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  CircleDashed,
  Layers,
  AlertCircle,
} from 'lucide-react';

import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

import { useScaffoldFocusStore } from '@/shared/model';

import { type ScaffoldDocumentNode, SCAFFOLD_CARD_SIZE } from '../model/types';

/**
 * ScaffoldDocumentCard (FSD Entity UI)
 *
 * 미로(Miro) 레퍼런스 스타일의 스캐폴딩 문서 노드.
 * 원본 참고 문서와 '= 동급' 크기(600x800)로 배치되며,
 * 1) 생성 중: 실시간 AI 프로세스(Vision -> 2D Grid -> DSL 추론 -> DOM 검증) 현황 시각화
 * 2) 완료 시: Tiptap 와이어프레임 캔버스 에디터(인라인 슬롯, 다단 그리드)가 카드에 직접 렌더링됩니다.
 */
export const ScaffoldDocumentCard = memo(function ScaffoldDocumentCard({
  id,
  data,
  selected = false,
}: NodeProps<ScaffoldDocumentNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const openFocus = useScaffoldFocusStore((s) => s.openFocus);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    },
    [id, setNodes, setEdges]
  );

  const handleOpenFocus = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openFocus(id);
    },
    [id, openFocus]
  );

  // 카드 본문에서 Tiptap 내용이 편집될 때 노드 데이터 실시간 동기화
  const handleUpdateHtml = useCallback(
    (html: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                htmlContent: html,
              },
            };
          }
          return n;
        })
      );
    },
    [id, setNodes]
  );

  const handleUpdateMarkdown = useCallback(
    (md: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                markdownContent: md,
              },
            };
          }
          return n;
        })
      );
    },
    [id, setNodes]
  );

  // 원본 참고 카드와 동급(=동일) 크기 산정
  const cardStyle = useMemo(() => {
    const width = data.width || SCAFFOLD_CARD_SIZE.width;
    const height = data.height || SCAFFOLD_CARD_SIZE.height;
    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [data.width, data.height]);

  const status = data.status || (data.htmlContent ? 'completed' : 'generating');
  const step = data.progressStep || 1;

  // AI 분석 단계 정의
  const progressSteps = [
    { num: 1, label: 'PDF Vision Rendering', desc: '고해상도 래스터화 및 비전 메타 추출' },
    { num: 2, label: '2D Layout & Grid Scan', desc: '다단 컬럼, 표, 섹션 바운딩 박스 감지' },
    { num: 3, label: 'agy-cli Tiptap DSL Inference', desc: '템플릿 문법 및 가변 슬롯([ ... ]) 추론' },
    { num: 4, label: 'DOM Validation & Assembly', desc: 'Tiptap 유효성 검증 및 서식 와이어프레임 완성' },
  ];

  const progressPercent = Math.min(step * 25, 95);

  return (
    <div
      style={cardStyle}
      className={`
        rounded-2xl border-2 transition-all duration-300 select-none
        flex flex-col overflow-hidden bg-slate-900 text-slate-100 shadow-2xl relative [contain:layout_style]
        ${
          selected
            ? 'border-purple-500 ring-4 ring-purple-400/30 z-30 shadow-purple-900/20'
            : 'border-purple-200/80 hover:border-purple-400 z-10 hover:z-20'
        }
      `}
    >
      {/* 1. 카드 상단 헤더 바 */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-purple-800/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-3">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            {status === 'generating' ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 border border-purple-700/50 px-2 py-0.5 rounded-full">
                {status === 'generating' ? 'AI 실시간 분석 중' : 'Tiptap 와이어프레임 서식'}
              </span>
              <span className="text-[10px] text-purple-400 font-mono">
                {status === 'generating' ? `${progressPercent}%` : 'v1.0'}
              </span>
            </div>
            <h4 className="font-bold text-sm text-white truncate leading-tight mt-0.5" title={data.title}>
              {data.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 포커스(전체화면 3단 모달) 버튼 */}
          <button
            onClick={handleOpenFocus}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-purple-600/40 text-purple-300 border border-slate-700 hover:border-purple-500 transition-all nodrag cursor-pointer"
            title="Playground 3단 전체 화면 포커스 편집"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {/* 노드 삭제 버튼 */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 transition-all nodrag cursor-pointer"
            title="서식 카드 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 카드 본문 뷰포트 (상태에 따른 분기) */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-950 relative">
        {/* CASE 1: AI 프로세스 진행 중 (Thinking & Generating) */}
        {status === 'generating' && (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto nowheel">
            <div className="flex flex-col gap-5">
              {/* 상단 펄스 타이틀 */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center gap-3 animate-pulse">
                <div className="p-2 rounded-lg bg-purple-600 text-white">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-purple-200">
                    AI 서식 분석 엔진이 문서를 스캐폴딩하고 있습니다
                  </h5>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    {data.progressMessage || '문서 2D 레이아웃 및 Tiptap 구조 추론 중...'}
                  </p>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>추출 파이프라인 진행률</span>
                  <span className="text-purple-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 4단계 스텝 목록 시각화 */}
              <div className="flex flex-col gap-2.5 mt-2">
                {progressSteps.map((s) => {
                  const isDone = step > s.num;
                  const isCurrent = step === s.num;

                  return (
                    <div
                      key={s.num}
                      className={`
                        p-3 rounded-xl border transition-all duration-300 flex items-start gap-3
                        ${
                          isCurrent
                            ? 'bg-purple-950/40 border-purple-500/80 shadow-md ring-1 ring-purple-500/30'
                            : isDone
                              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                              : 'bg-slate-900/20 border-slate-900/60 text-slate-600'
                        }
                      `}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-purple-200' : isDone ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {s.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                              In Progress
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단 팁 */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                완료 즉시 카드 상에 Tiptap 인터랙티브 편집기가 렌더링됩니다
              </span>
            </div>
          </div>
        )}

        {/* CASE 2: 완료 시 원본 카드와 '= 동급'의 Tiptap 서식 에디터 화면 직접 렌더링 (핵심!) */}
        {status === 'completed' && (
          <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-900 nodrag nowheel">
            <div className="max-w-full mx-auto">
              <ScaffoldCanvasEditor
                initialContent={data.htmlContent}
                onChangeHtml={handleUpdateHtml}
                onChangeMarkdown={handleUpdateMarkdown}
              />
            </div>
          </div>
        )}

        {/* CASE 3: 에러 발생 시 */}
        {status === 'error' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">서식 추출에 실패했습니다</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {data.errorMessage || '문서 분석 중 오류가 발생했습니다. 원본 카드의 버튼을 눌러 다시 시도해 주세요.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 메타 바 */}
      <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>연동: {data.sourcePdfFileName || 'PDF'}</span>
          {data.difficulty && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 uppercase font-mono">
              {data.difficulty}
            </span>
          )}
        </div>
        <button
          onClick={handleOpenFocus}
          className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-colors flex items-center gap-1"
        >
          <span>Playground 전체화면 ↗</span>
        </button>
      </div>

      {/* 4. React Flow 엣지 핸들 (미로 스타일 연결점) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-slate-900 !shadow-lg transition-transform hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-slate-900 !shadow-lg transition-transform hover:!scale-125"
      />
    </div>
  );
});
