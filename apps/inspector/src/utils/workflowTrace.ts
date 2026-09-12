/**
 * @fileoverview Workflow Trace Text Generator
 * 런(Run)의 모든 스팬을 분석하여 IN ➔ PROCESS ➔ OUT 시퀀스를
 * GitHub Split Diff에서 1:1 대조하기에 최적화된 정형 텍스트로 생성합니다.
 */

import type { SpanRecord } from '../types'

function isFileName(val?: string | null): boolean {
  if (!val) return false
  const lower = val.toLowerCase()
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.hwp') ||
    lower.endsWith('.hwpx') ||
    lower.endsWith('.json') ||
    lower.endsWith('.md')
  )
}

function deriveDataFlow(span: SpanRecord): { in: string | null; out: string | null; via: string[] } {
  let dataIn = span.data_in || null
  let dataOut = span.data_out || null
  const dataVia = span.data_via && span.data_via.length > 0 ? span.data_via : []

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

function labelIn(val: string | null): string {
  if (!val) return '(없음)'
  if (val.startsWith('docId:')) return `[식별자] ${val}`
  if (isFileName(val)) return `[입력 원본] ${val}`
  if (val.startsWith('Policy:')) return `[정책/설정] ${val}`
  if (val.startsWith('Prompt')) return `[프롬프트] ${val}`
  if (val.includes('DocumentContext') || val.includes('OutlineDocument')) return `[클래스] ${val}`
  if (val.includes('Structured')) return `[데이터] ${val}`
  return `[데이터] ${val}`
}

function labelOut(val: string | null): string {
  if (!val) return '(없음)'
  if (val.includes('Cache Miss') || val.includes('Cache Hit')) return `[판정 결과] ${val}`
  if (val.includes('Validation Passed') || val.includes('Validation Failed')) return `[판정 결과] ${val}`
  if (val.startsWith('Target Engine:')) return `[배정 엔진] ${val}`
  if (val.includes('DocumentContext') || val.includes('OutlineDocument')) return `[클래스] ${val}`
  if (val.startsWith('artifact-') || val.includes('.json')) return `[아티팩트] ${val}`
  if (val.startsWith('Prompt String')) return `[프롬프트] ${val}`
  return `[출력] ${val}`
}

export function generateWorkflowTraceText(params: {
  runId: string
  taskLabel?: string
  totalDurationMs: number
  primaryModel?: string | null
  spans: readonly SpanRecord[]
}): string {
  const { runId, taskLabel, totalDurationMs, primaryModel, spans } = params

  const lines: string[] = []

  lines.push('# WORKFLOW PIPELINE FLOW (IN ➔ PROCESS ➔ OUT)')
  lines.push(`Run ID     : ${runId}`)
  lines.push(`Task       : ${taskLabel || 'Pipeline Run'}`)
  lines.push(`Engine/Model: ${primaryModel || 'Default Model'}`)
  lines.push(`Duration   : ${(totalDurationMs / 1000).toFixed(2)}s (${totalDurationMs.toLocaleString()} ms)`)
  lines.push(`Total Steps: ${spans.length} Spans`)
  lines.push('='.repeat(80))
  lines.push('')

  spans.forEach((span, idx) => {
    const stepNum = idx + 1
    const stepTitle = span.display_label || span.name
    const stepType = (span.span_type || 'span').toUpperCase()
    const durMs = (span.duration_ms || 0).toFixed(1)
    const status = (span.status || 'OK').toUpperCase()

    lines.push(`[Step ${stepNum}] ${stepTitle} (${stepType}) · ${durMs} ms · ${status}`)

    if (span.description) {
      lines.push(`  DESC    : ${span.description}`)
    }

    const flow = deriveDataFlow(span)
    const formattedIn = labelIn(flow.in)
    const formattedVia = flow.via.length > 0 ? flow.via.join(' ➔ ') : (span.metadata?.source_file ? String(span.metadata.source_file) : 'core_pipeline')
    const formattedOut = labelOut(flow.out)

    lines.push(`  IN      : ${formattedIn}`)
    lines.push(`  PROCESS : ${formattedVia}`)
    lines.push(`  OUT     : ${formattedOut}`)

    if (span.summary_pill) {
      lines.push(`  RESULT  : ${span.summary_pill}`)
    }

    if (span.span_type === 'llm' || span.usage?.total_tokens) {
      const model = span.attempts?.[0]?.model || primaryModel || 'LLM'
      const inTok = Number(span.usage?.prompt_tokens || 0).toLocaleString()
      const outTok = Number(span.usage?.completion_tokens || 0).toLocaleString()
      const totalTok = Number(span.usage?.total_tokens || 0).toLocaleString()
      lines.push(`  LLM STAT: Model=${model} | Prompt=${inTok} tok | Output=${outTok} tok | Total=${totalTok} tok`)
    }

    lines.push('')
  })

  lines.push('='.repeat(80))
  lines.push('# END OF WORKFLOW TRACE')

  return lines.join('\n')
}
