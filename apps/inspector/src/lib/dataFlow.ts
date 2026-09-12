/**
 * @fileoverview 스팬의 데이터 흐름(IN ➔ VIA ➔ OUT) 유도.
 *
 * 이 로직은 `RunTimeline`(FLOW 칩), `workflowTrace`(Compare 텍스트),
 * `PipelineTreeView`(입력 파일 표시) 세 곳에 **복붙되어 있었다.** 한 곳만
 * 고치면 같은 스팬이 화면과 Compare 텍스트에서 다르게 보인다.
 *
 * 유도가 필요한 이유: 파이프라인이 `data_in`/`data_out` 을 안 적었을 때
 * 페이로드에서 짐작한다. 적혀 있으면 그것이 우선이다 — 짐작은 최후수단이다.
 */

import type { SpanRecordView } from '../types'
import { numberOf, textOf } from './payload'

const DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.txt',
  '.md',
  '.json',
  '.hwp',
  '.hwpx',
] as const

/** 파일명처럼 보이는가. 아이콘 선택에만 쓴다. */
export function isFileName(value?: string | null): boolean {
  if (!value) return false
  const lower = value.toLowerCase()
  return DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export interface DataFlow {
  readonly in: string | null
  readonly out: string | null
  /** 경유 지점의 표시 이름. 구조화된 `sources` 가 있으면 그것에서 온다. */
  readonly via: readonly string[]
}

function viaLabels(span: SpanRecordView): string[] {
  // 구조화된 코드 지점이 있으면 그것이 정본이다.
  if (span.sources && span.sources.length > 0) {
    return span.sources.map((source) => {
      if (source.label) return source.label
      if (source.kind === 'model') return source.qualname
      const tail = source.module.split('.').pop() || source.module
      return source.qualname ? `${tail}.${source.qualname}` : tail
    })
  }
  // 구조화 이전에 기록된 run 은 문자열밖에 없다.
  return span.data_via && span.data_via.length > 0 ? [...span.data_via] : []
}

export function deriveDataFlow(span: SpanRecordView): DataFlow {
  let dataIn = span.data_in || null
  let dataOut = span.data_out || null

  // 파이프라인이 적지 않았을 때만 짐작한다.
  if (!dataIn) {
    const fileName = textOf(span.inputs, 'filename', 'file_name')
    const promptChars = numberOf(span.inputs, 'prompt_chars')
    const docId = textOf(span.inputs, 'docId', 'doc_id')

    if (fileName) dataIn = fileName
    else if (promptChars !== null) dataIn = `Prompt (${promptChars.toLocaleString()} chars)`
    else if (
      numberOf(span.inputs, 'instructions_chars') !== null ||
      numberOf(span.inputs, 'dynamic_context_chars') !== null
    ) {
      dataIn = 'DocumentContext + Instructions'
    } else if (docId) dataIn = `docId: ${docId}`
  }

  if (!dataOut) {
    const contextChars = numberOf(span.outputs, 'context_chars')
    const promptChars = numberOf(span.outputs, 'total_prompt_chars')
    const outlines = numberOf(span.outputs, 'outlines_count')
    const artifactId = textOf(span.outputs, 'artifactId', 'artifact_id')

    if (contextChars !== null) dataOut = `DocumentContext (${contextChars.toLocaleString()} chars)`
    else if (promptChars !== null) dataOut = `Prompt String (${promptChars.toLocaleString()} chars)`
    else if (outlines !== null) dataOut = `OutlineDocument (${outlines} nodes)`
    else if (span.outputs?.has_structured_output) dataOut = 'Structured JSON'
    else if (artifactId) dataOut = `artifact-${artifactId.slice(0, 8)}.json`
  }

  return { in: dataIn, out: dataOut, via: viaLabels(span) }
}
