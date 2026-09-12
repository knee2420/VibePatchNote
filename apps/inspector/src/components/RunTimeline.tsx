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
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react'
import type { CompareItem, SpanPhase, SpanRecordView, SpanType } from '../types'
import { hasFallback } from '../types'
import { generateWorkflowTraceText } from '../utils/workflowTrace'
import { PipelineTreeView } from './PipelineTreeView'

interface RunTimelineProps {
  runId?: string
  runLabel?: string
  primaryModel?: string | null
  spans: SpanRecordView[]
  selectedSpanId: string | null
  onSelectSpan: (spanId: string) => void
  totalDurationMs: number
  isCompareMode?: boolean
  compareSlotAId?: string | null
  compareSlotBId?: string | null
  onPickCompareItem?: (item: CompareItem) => void
}

// `workflow` · `custom` 은 프론트가 지어낸 유형이었다. 백엔드 `SpanType` 열거형에
// 없으므로 생산자가 방출할 수 없고, 따라서 해당 분기는 영원히 죽은 코드였다.
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
    case 'pipeline':
      return <Cpu className="w-4 h-4 text-cyan-400" />
    default:
      return <Zap className="w-4 h-4 text-slate-400" />
  }
}

function getSpanTypeBadge(type: SpanType) {
  const styles: Record<SpanType, string> = {
    pipeline: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    chain: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    llm: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    tool: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    parser: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${
        styles[type] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {type}
    </span>
  )
}

function inferPhase(span: SpanRecordView, allSortedSpans: SpanRecordView[]): SpanPhase {
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

function deriveDataFlow(span: SpanRecordView): { in: string | null; out: string | null; via: string[] } {
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
  runId,
  runLabel,
  primaryModel,
  spans,
  selectedSpanId,
  onSelectSpan,
  totalDurationMs,
  isCompareMode = false,
  compareSlotAId,
  compareSlotBId,
  onPickCompareItem,
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

  // 부모 → 자식 색인. `StepCollector` 는 중첩 `with` 를 부모 스택으로 기록한다.
  const childrenOf = new Map<string, typeof spansWithPhase>()
  const presentIds = new Set(spansWithPhase.map((s) => s.span_id))
  for (const span of spansWithPhase) {
    const parentId = span.parent_span_id
    // 부모가 이 목록에 없으면(잘린 원장 등) 고아가 아니라 루트로 취급한다.
    if (!parentId || !presentIds.has(parentId)) continue
    const bucket = childrenOf.get(parentId) ?? []
    bucket.push(span)
    childrenOf.set(parentId, bucket)
  }

  // 페이즈 그룹에는 **루트만** 올린다. 자식은 부모 카드 안에서 렌더된다.
  const roots = spansWithPhase.filter(
    (s) => !s.parent_span_id || !presentIds.has(s.parent_span_id)
  )
  const preLlmSpans = roots.filter((s) => s.computedPhase === 'pre_llm')
  const llmSpans = roots.filter((s) => s.computedPhase === 'llm')
  const postLlmSpans = roots.filter((s) => s.computedPhase === 'post_llm')

  // 페이즈별 총 소요시간. 루트만 더한다 — 부모의 duration 은 자식 시간을 이미
  // 포함하므로, 전체를 더하면 중첩된 만큼 이중 계산된다.
  const durationOf = (phase: SpanPhase) =>
    roots
      .filter((s) => s.computedPhase === phase)
      .reduce((acc, s) => acc + (s.duration_ms || 0), 0)
  const preDuration = durationOf('pre_llm')
  const llmDuration = durationOf('llm')
  const postDuration = durationOf('post_llm')
  const safeTotal = Math.max(totalDurationMs, preDuration + llmDuration + postDuration, 1)

  const renderSpanCard = (span: (typeof spansWithPhase)[0], depth = 0) => {
    const childSpans = childrenOf.get(span.span_id) ?? []
    const isSelected = span.span_id === selectedSpanId
    const isTreeExpanded = Boolean(expandedSpanIds[span.span_id])
    const flow = deriveDataFlow(span)
    // 폴백은 상태값이 아니라 "시도가 2회 이상"이라는 사실이다.
    // 예전에는 백엔드에 존재하지 않는 'FALLBACK_TRIGGERED' 와 비교하고 있었다.
    const fellBack = hasFallback(span)

    // 한글 명칭 우선 노출 (fallback: span.name)
    const mainTitle = span.display_label || span.name
    const subtitle = span.display_label ? span.name : null

    // Compare 슬롯 등록 여부
    const spanItemId = `span:${span.span_id}`
    const isSlotA = compareSlotAId === spanItemId
    const isSlotB = compareSlotBId === spanItemId

    const card = (
      <div
        key={span.span_id}
        onClick={() => onSelectSpan(span.span_id)}
        style={depth > 0 ? { marginLeft: `${depth * 14}px` } : undefined}
        className={`p-3.5 rounded-md border transition-all cursor-pointer ${
          depth > 0 ? 'border-l-2 border-l-[#30363d]' : ''
        } ${
          isSelected
            ? 'bg-[#161b22] border-[#58a6ff] shadow-sm'
            : 'bg-[#161b22]/40 border-[#30363d] hover:border-[#848d97]/50 hover:bg-[#161b22]/70'
        }`}
      >
        {/* 상단: 타이틀 + 뱃지 + 실행시간 + Compare 픽 버튼 */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1 rounded-md bg-[#21262d] border border-[#30363d] shrink-0">
              {getSpanIcon(span.span_type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#e6edf3] truncate">
                  {mainTitle}
                </span>
                {getSpanTypeBadge(span.span_type)}
                {fellBack && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[rgba(210,153,34,0.15)] text-[#d29922] border border-[rgba(210,153,34,0.3)] font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    자동 폴백 전환
                  </span>
                )}
              </div>
              {subtitle && (
                <div className="text-[11px] font-mono text-[#848d97] truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0 flex items-center gap-2">
            {/* Compare 모드일 때 스팬 카드 픽 버튼 */}
            {isCompareMode && (
              <div>
                {isSlotA ? (
                  <span className="px-1.5 py-0.2 rounded bg-[rgba(248,81,73,0.15)] text-[#f85149] border border-[rgba(248,81,73,0.3)] text-[9px] font-mono font-bold">
                    🅰️ 픽됨
                  </span>
                ) : isSlotB ? (
                  <span className="px-1.5 py-0.2 rounded bg-[rgba(46,160,67,0.15)] text-[#3fb950] border border-[rgba(46,160,67,0.3)] text-[9px] font-mono font-bold">
                    🅱️ 픽됨
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPickCompareItem?.({
                        id: spanItemId,
                        type: 'span',
                        title: `[Span] ${mainTitle}`,
                        subtitle: `${span.span_type.toUpperCase()} · ${(
                          (span.duration_ms || 0) / 1000
                        ).toFixed(2)}s`,
                        content: JSON.stringify(span, null, 2),
                        language: 'json',
                        spanId: span.span_id,
                      })
                    }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#21262d] text-[#58a6ff] border border-[#30363d] hover:bg-[#30363d] transition-colors shadow-sm cursor-pointer"
                    title="이 스팬 카드를 Compare 슬롯에 추가"
                  >
                    + Compare
                  </button>
                )}
              </div>
            )}

            <span className="font-mono text-xs font-semibold text-[#e6edf3]">
              {(span.duration_ms || 0).toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              ms
            </span>
          </div>
        </div>

        {/* 중단: 이용자 관점 설명, 데이터 흐름 칩 & 결과 성과 요약 */}
        {(() => {
          const hasContent = Boolean(span.description || span.summary_pill || flow.in || flow.out || flow.via.length > 0)
          if (!hasContent) return null

          return (
            <div className="mt-2 pt-2 border-t border-[#30363d]/60 flex flex-col gap-2">
              {span.description && (
                <p className="text-xs text-[#848d97] leading-relaxed">
                  {span.description}
                </p>
              )}

              {/* 데이터 흐름 (Input ➔ Via Pipeline ➔ Output Chip UI) */}
              {(flow.in || flow.out || flow.via.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap py-1.5 px-2 rounded-md bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[10px] font-bold tracking-wider text-[#848d97] uppercase shrink-0">
                    FLOW
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {/* 1. INPUT */}
                    {flow.in && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#58a6ff] font-mono text-[11px] shadow-sm">
                        <span className="text-[9px] font-bold text-[#58a6ff] bg-[#30363d] px-1 py-0.2 rounded">
                          IN
                        </span>
                        {isFileName(flow.in) ? (
                          <FileText className="w-3 h-3 text-[#58a6ff] shrink-0" />
                        ) : (
                          <Box className="w-3 h-3 text-[#58a6ff] shrink-0" />
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
                          <ArrowRight className="w-3 h-3 text-[#6e7681] shrink-0" />
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#bc8cff] font-mono text-[11px] shadow-sm">
                          <span className="text-[9px] font-bold text-[#bc8cff] bg-[#30363d] px-1 py-0.2 rounded">
                            VIA
                          </span>
                          <FileCode className="w-3 h-3 text-[#bc8cff] shrink-0" />
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
                          <ArrowRight className="w-3 h-3 text-[#6e7681] shrink-0" />
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#3fb950] font-mono text-[11px] shadow-sm">
                          <span className="text-[9px] font-bold text-[#3fb950] bg-[#30363d] px-1 py-0.2 rounded">
                            OUT
                          </span>
                          {isFileName(flow.out) ? (
                            <FileText className="w-3 h-3 text-[#3fb950] shrink-0" />
                          ) : (
                            <Box className="w-3 h-3 text-[#3fb950] shrink-0" />
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
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[rgba(46,160,67,0.15)] text-[#3fb950] border border-[rgba(46,160,67,0.3)]">
                    <CheckCircle2 className="w-3 h-3 text-[#3fb950]" />
                    {span.summary_pill}
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        {/* 하단: 트리 펼치기 토글 & 식별자 */}
        <div className="mt-3 pt-2.5 border-t border-[#30363d]/60 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedSpanIds((prev) => ({
                ...prev,
                [span.span_id]: !prev[span.span_id],
              }))
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#58a6ff] hover:text-[#79c0ff] py-1 px-2.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer select-none"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>관여 함수 & 객체 파이프라인 트리</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isTreeExpanded ? 'rotate-180 text-[#58a6ff]' : 'text-[#848d97]'
              }`}
            />
          </button>

          <div className="flex items-center gap-2 text-[10px] font-mono text-[#848d97]">
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
              isCompareMode={isCompareMode}
              compareSlotAId={compareSlotAId}
              compareSlotBId={compareSlotBId}
              onPickCompareItem={onPickCompareItem}
            />
          </div>
        )}
      </div>
    )

    if (childSpans.length === 0) return card

    // 중첩 스팬. `StepCollector` 가 부모 스택으로 기록한 계층을 그대로 편다.
    // 자식이 없으면 카드 하나만 돌려주므로, 평평한 원장은 예전과 같이 보인다.
    return (
      <React.Fragment key={span.span_id}>
        {card}
        <div className="space-y-2">
          {childSpans.map((child) => renderSpanCard(child, depth + 1))}
        </div>
      </React.Fragment>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] border-r border-[#30363d] overflow-hidden">
      {/* 1. 최상단 헤더 */}
      <div className="p-3.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold tracking-wider text-[#e6edf3] uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#58a6ff]" />
            Execution Waterfall ({spans.length} Spans)
          </h2>

          {/* 전체 워크플로우 비교 버튼 */}
          {isCompareMode && runId && (
            <div>
              {compareSlotAId === `workflow:${runId}` ? (
                <span className="px-2 py-0.5 rounded bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 text-[10px] font-mono font-bold">
                  🅰️ 워크플로우 픽됨
                </span>
              ) : compareSlotBId === `workflow:${runId}` ? (
                <span className="px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 text-[10px] font-mono font-bold">
                  🅱️ 워크플로우 픽됨
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onPickCompareItem?.({
                      id: `workflow:${runId}`,
                      type: 'workflow',
                      title: `[전체 워크플로우] ${runLabel || runId.slice(0, 8)}`,
                      subtitle: `${primaryModel || 'Pipeline'} (${spans.length} Steps)`,
                      content: generateWorkflowTraceText({
                        runId,
                        taskLabel: runLabel,
                        totalDurationMs: safeTotal,
                        primaryModel,
                        spans: sortedSpans,
                      }),
                      language: 'text',
                      runId,
                    })
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#21262d] text-[#58a6ff] border border-[#30363d] hover:bg-[#30363d] hover:text-[#e6edf3] transition-colors shadow-sm cursor-pointer"
                  title="이 실행의 전체 IN ➔ PROCESS ➔ OUT 워크플로우를 다른 실행과 비교합니다"
                >
                  <Workflow className="w-3 h-3 text-[#58a6ff]" />
                  <span>+ 전체 워크플로우 비교</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-[#848d97] font-mono">
          Total Duration: <span className="text-[#58a6ff] font-semibold">{(safeTotal / 1000).toFixed(2)}s</span>
        </div>
      </div>

      {/* 2. 상단 E2E 3단계 Stepper Bar (GitHub Actions Job Group 스타일) */}
      <div className="p-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="grid grid-cols-3 gap-2">
          {/* Phase 1: Pre-LLM */}
          <div className="p-2 rounded-md border border-[#30363d] bg-[#0d1117] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#58a6ff] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]" />
                1. 인입 & 하네스 라우팅
              </span>
              <span className="text-[10px] font-mono text-[#848d97]">
                {preLlmSpans.length}단계
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-[#e6edf3]">
              {preDuration.toFixed(1)} ms
            </div>
          </div>

          {/* Phase 2: LLM Inference */}
          <div className="p-2 rounded-md border border-[#30363d] bg-[#0d1117] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#bc8cff] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#bc8cff]" />
                2. 프롬프트 & AI 모델 추론
              </span>
              <span className="text-[10px] font-mono text-[#bc8cff]">
                {safeTotal > 0 ? `${((llmDuration / safeTotal) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-[#e6edf3]">
              {(llmDuration / 1000).toFixed(2)} s
            </div>
          </div>

          {/* Phase 3: Post-LLM */}
          <div className="p-2 rounded-md border border-[#30363d] bg-[#0d1117] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#3fb950] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#3fb950]" />
                3. 스키마 검증 & 원장 정산
              </span>
              <span className="text-[10px] font-mono text-[#848d97]">
                {postLlmSpans.length}단계
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-[#e6edf3]">
              {postDuration.toFixed(1)} ms
            </div>
          </div>
        </div>
      </div>

      {/* 3. 본문: 페이즈별 그룹화 워터폴 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#0d1117]">
        {/* 그룹 1: Pre-LLM */}
        {preLlmSpans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#58a6ff] px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                인입, 사전 검사 & 하네스 정책 라우팅 (Pre-LLM)
              </span>
              <span className="text-[11px] font-mono text-[#848d97]">
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
            <div className="flex items-center justify-between text-xs font-semibold text-[#bc8cff] px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#bc8cff]" />
                프롬프트 조립 & AI 모델 핵심 추론 (LLM Inference)
              </span>
              <span className="text-[11px] font-mono text-[#bc8cff]">
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
            <div className="flex items-center justify-between text-xs font-semibold text-[#3fb950] px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
                스키마 검증, 아티팩트 커밋 & 원장 정산 (Post-LLM)
              </span>
              <span className="text-[11px] font-mono text-[#848d97]">
                {postDuration.toFixed(1)} ms
              </span>
            </div>
            <div className="space-y-2">
              {postLlmSpans.map(renderSpanCard)}
            </div>
          </div>
        )}

        {sortedSpans.length === 0 && (
          <div className="h-40 flex items-center justify-center text-[#848d97] text-xs">
            기록된 실행 단계가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
