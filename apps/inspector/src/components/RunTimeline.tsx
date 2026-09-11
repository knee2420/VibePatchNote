import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Box,
  Braces,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileCode,
  FileText,
  FolderTree,
  Layers,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import type { SpanPhase, SpanRecord, SpanType } from '../types'
import { PipelineTreeView } from './PipelineTreeView'

interface RunTimelineProps {
  spans: SpanRecord[]
  selectedSpanId: string | null
  onSelectSpan: (spanId: string) => void
  totalDurationMs: number
}

function getSpanIcon(type: SpanType) {
  switch (type) {
    case 'llm':
      return <Bot className="w-4 h-4 text-purple-400" />
    case 'tool':
      return <Wrench className="w-4 h-4 text-amber-400" />
    case 'chain':
      return <Layers className="w-4 h-4 text-blue-400" />
    case 'parser':
      return <Braces className="w-4 h-4 text-emerald-400" />
    case 'workflow':
      return <Cpu className="w-4 h-4 text-cyan-400" />
    default:
      return <Zap className="w-4 h-4 text-slate-400" />
  }
}

function getSpanTypeBadge(type: SpanType) {
  const styles: Record<SpanType, string> = {
    workflow: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pipeline: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    chain: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    llm: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    tool: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    parser: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    custom: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${
        styles[type] || styles.custom
      }`}
    >
      {type}
    </span>
  )
}

function inferPhase(span: SpanRecord, allSortedSpans: SpanRecord[]): SpanPhase {
  if (span.phase) return span.phase
  if (span.span_type === 'llm' || span.name.toLowerCase().startsWith('llm:')) {
    return 'llm'
  }
  const llmIndex = allSortedSpans.findIndex(
    (s) => s.span_type === 'llm' || s.name.toLowerCase().startsWith('llm:')
  )
  if (llmIndex === -1) return 'pre_llm'
  const currentIndex = allSortedSpans.findIndex((s) => s.span_id === span.span_id)
  return currentIndex < llmIndex ? 'pre_llm' : 'post_llm'
}

function isFileName(val?: string | null): boolean {
  if (!val) return false
  const lower = val.toLowerCase()
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.json') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.xlsx')
  )
}

function deriveDataFlow(span: SpanRecord): { in: string | null; out: string | null; via: string[] } {
  let dataIn = span.data_in || null
  let dataOut = span.data_out || null
  const dataVia = span.data_via && span.data_via.length > 0 ? span.data_via : []

  // Fallback heuristics if not explicitly provided
  if (!dataIn && span.inputs) {
    if (span.inputs.filename) dataIn = String(span.inputs.filename)
    else if (span.inputs.file_name) dataIn = String(span.inputs.file_name)
    else if (span.inputs.prompt_chars) dataIn = `Prompt (${Number(span.inputs.prompt_chars).toLocaleString()} chars)`
    else if (span.inputs.instructions_chars || span.inputs.dynamic_context_chars) dataIn = 'DocumentContext + Instructions'
    else if (span.name.includes('Validation')) dataIn = 'Structured JSON'
    else if (span.name.includes('Commit')) dataIn = 'OutlineDocument'
    else if (span.inputs.docId) dataIn = `docId: ${span.inputs.docId}`
  }

  if (!dataOut && span.outputs) {
    if (span.outputs.context_chars) dataOut = `DocumentContext (${Number(span.outputs.context_chars).toLocaleString()} chars)`
    else if (span.outputs.total_prompt_chars) dataOut = `Prompt String (${Number(span.outputs.total_prompt_chars).toLocaleString()} chars)`
    else if (span.outputs.outlines_count !== undefined) dataOut = `OutlineDocument (${span.outputs.outlines_count} nodes)`
    else if (span.outputs.has_structured_output) dataOut = 'Structured JSON'
    else if (span.outputs.artifactId) dataOut = `artifact-${String(span.outputs.artifactId).slice(0, 8)}.json`
  }

  return { in: dataIn, out: dataOut, via: dataVia }
}

export const RunTimeline: React.FC<RunTimelineProps> = ({
  spans,
  selectedSpanId,
  onSelectSpan,
  totalDurationMs,
}) => {
  const [expandedSpanIds, setExpandedSpanIds] = useState<Record<string, boolean>>({})

  // Dotted order(계층형 ISO 타임스탬프) 기준으로 정렬
  const sortedSpans = [...spans].sort((a, b) => {
    return (a.dotted_order || '').localeCompare(b.dotted_order || '')
  })

  // 각 스팬에 페이즈 바인딩
  const spansWithPhase = sortedSpans.map((span) => ({
    ...span,
    computedPhase: inferPhase(span, sortedSpans),
  }))

  // 3개 페이즈 그룹핑
  const preLlmSpans = spansWithPhase.filter((s) => s.computedPhase === 'pre_llm')
  const llmSpans = spansWithPhase.filter((s) => s.computedPhase === 'llm')
  const postLlmSpans = spansWithPhase.filter((s) => s.computedPhase === 'post_llm')

  // 페이즈별 총 소요시간
  const preDuration = preLlmSpans.reduce((acc, s) => acc + (s.duration_ms || 0), 0)
  const llmDuration = llmSpans.reduce((acc, s) => acc + (s.duration_ms || 0), 0)
  const postDuration = postLlmSpans.reduce((acc, s) => acc + (s.duration_ms || 0), 0)
  const safeTotal = Math.max(totalDurationMs, preDuration + llmDuration + postDuration, 1)

  const renderSpanCard = (span: (typeof spansWithPhase)[0]) => {
    const isSelected = span.span_id === selectedSpanId
    const isTreeExpanded = Boolean(expandedSpanIds[span.span_id])
    const flow = deriveDataFlow(span)
    const hasFallback =
      span.status === 'FALLBACK_TRIGGERED' || (span.attempts && span.attempts.length > 1)

    // 한글 명칭 우선 노출 (fallback: span.name)
    const mainTitle = span.display_label || span.name
    const subtitle = span.display_label ? span.name : null

    return (
      <div
        key={span.span_id}
        onClick={() => onSelectSpan(span.span_id)}
        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
          isSelected
            ? 'bg-slate-800/95 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/80'
        }`}
      >
        {/* 상단: 타이틀 + 뱃지 + 실행시간 */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1 rounded bg-slate-800/80 border border-slate-700/60 shrink-0">
              {getSpanIcon(span.span_type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {mainTitle}
                </span>
                {getSpanTypeBadge(span.span_type)}
                {hasFallback && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    자동 폴백 전환
                  </span>
                )}
              </div>
              {subtitle && (
                <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-xs font-semibold text-slate-200">
              {(span.duration_ms || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ms
            </span>
          </div>
        </div>

        {/* 중단: 이용자 관점 설명, 데이터 흐름 칩 & 결과 성과 요약 */}
        {(() => {
          const hasContent = Boolean(span.description || span.summary_pill || flow.in || flow.out || flow.via.length > 0)
          if (!hasContent) return null

          return (
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-col gap-2">
              {span.description && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {span.description}
                </p>
              )}

              {/* 데이터 흐름 (Input ➔ Via Pipeline ➔ Output Chip UI) */}
              {(flow.in || flow.out || flow.via.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap py-1.5 px-2 rounded-md bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase shrink-0">
                    FLOW
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {/* 1. INPUT */}
                    {flow.in && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800/60 text-sky-300 font-mono text-[11px] shadow-sm">
                        <span className="text-[9px] font-bold text-sky-400 bg-sky-900/90 px-1 py-0.2 rounded">
                          IN
                        </span>
                        {isFileName(flow.in) ? (
                          <FileText className="w-3 h-3 text-sky-400 shrink-0" />
                        ) : (
                          <Box className="w-3 h-3 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]" title={flow.in}>
                          {flow.in}
                        </span>
                      </span>
                    )}

                    {/* 2. VIA (관여 파일/클래스 체인) */}
                    {flow.via.map((viaItem, idx) => (
                      <React.Fragment key={idx}>
                        {(flow.in || idx > 0) && (
                          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/60 text-purple-300 font-mono text-[11px] shadow-sm">
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-900/90 px-1 py-0.2 rounded">
                            VIA
                          </span>
                          <FileCode className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[220px]" title={viaItem}>
                            {viaItem}
                          </span>
                        </span>
                      </React.Fragment>
                    ))}

                    {/* 3. OUTPUT */}
                    {flow.out && (
                      <>
                        {(flow.in || flow.via.length > 0) && (
                          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono text-[11px] shadow-sm">
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-900/90 px-1 py-0.2 rounded">
                            OUT
                          </span>
                          {isFileName(flow.out) ? (
                            <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Box className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]" title={flow.out}>
                            {flow.out}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {span.summary_pill && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    {span.summary_pill}
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        {/* 하단: 트리 펼치기 토글 & 식별자 (타임바 제거 완료) */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedSpanIds((prev) => ({
                ...prev,
                [span.span_id]: !prev[span.span_id],
              }))
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 py-1 px-2.5 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 transition-all cursor-pointer select-none"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>관여 함수 & 객체 파이프라인 트리</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isTreeExpanded ? 'rotate-180 text-cyan-300' : 'text-cyan-500'
              }`}
            />
          </button>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className="truncate max-w-[200px]">
              ID: {span.dotted_order.split('span-')[1] ? `span-${span.dotted_order.split('span-')[1]}` : span.span_id}
            </span>
            <span>
              {safeTotal > 0 ? `${(((span.duration_ms || 0) / safeTotal) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* 펼쳐진 파이프라인 트리 및 원본 소스 코드 뷰어 */}
        {isTreeExpanded && (
          <div onClick={(e) => e.stopPropagation()}>
            <PipelineTreeView
              span={span}
              dataIn={flow.in}
              dataOut={flow.out}
              dataVia={flow.via}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] border-r border-slate-800/80 overflow-hidden">
      {/* 1. 최상단 헤더 */}
      <div className="p-3.5 border-b border-slate-800 bg-[#11192e] flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Execution Waterfall ({spans.length} Spans)
        </h2>
        <div className="text-xs text-slate-400 font-mono">
          Total Duration: <span className="text-cyan-300 font-semibold">{(safeTotal / 1000).toFixed(2)}s</span>
        </div>
      </div>

      {/* 2. 상단 E2E 3단계 Stepper Bar (이용자가 한눈에 보는 흐름도) */}
      <div className="p-3 bg-[#0d1424] border-b border-slate-800/80">
        <div className="grid grid-cols-3 gap-2">
          {/* Phase 1: Pre-LLM */}
          <div className="p-2 rounded border border-blue-500/20 bg-blue-950/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                1. 인입 & 하네스 라우팅
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {preLlmSpans.length}단계
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-slate-200">
              {preDuration.toFixed(1)} ms
            </div>
          </div>

          {/* Phase 2: LLM Inference */}
          <div className="p-2 rounded border border-purple-500/30 bg-purple-950/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                2. 프롬프트 & AI 모델 추론
              </span>
              <span className="text-[10px] font-mono text-purple-400">
                {safeTotal > 0 ? `${((llmDuration / safeTotal) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-purple-200">
              {(llmDuration / 1000).toFixed(2)} s
            </div>
          </div>

          {/* Phase 3: Post-LLM */}
          <div className="p-2 rounded border border-emerald-500/20 bg-emerald-950/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                3. 스키마 검증 & 원장 정산
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {postLlmSpans.length}단계
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-slate-200">
              {postDuration.toFixed(1)} ms
            </div>
          </div>
        </div>
      </div>

      {/* 3. 본문: 페이즈별 그룹화 워터폴 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 그룹 1: Pre-LLM */}
        {preLlmSpans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                인입, 사전 검사 & 하네스 정책 라우팅 (Pre-LLM)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {preDuration.toFixed(1)} ms
              </span>
            </div>
            <div className="space-y-2">
              {preLlmSpans.map(renderSpanCard)}
            </div>
          </div>
        )}

        {/* 그룹 2: LLM Inference */}
        {llmSpans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300 px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                프롬프트 조립 & AI 모델 핵심 추론 (LLM Inference)
              </span>
              <span className="text-[11px] font-mono text-purple-400">
                {(llmDuration / 1000).toFixed(2)} s
              </span>
            </div>
            <div className="space-y-2">
              {llmSpans.map(renderSpanCard)}
            </div>
          </div>
        )}

        {/* 그룹 3: Post-LLM */}
        {postLlmSpans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                스키마 검증, 아티팩트 커밋 & 원장 정산 (Post-LLM)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {postDuration.toFixed(1)} ms
              </span>
            </div>
            <div className="space-y-2">
              {postLlmSpans.map(renderSpanCard)}
            </div>
          </div>
        )}

        {sortedSpans.length === 0 && (
          <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
            기록된 실행 단계가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
