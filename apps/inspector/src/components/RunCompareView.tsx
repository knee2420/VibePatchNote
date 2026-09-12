/**
 * @fileoverview Cross-Trace Element-Level Run & Span Diff/Compare View
 * 서로 다른 두 실행(Run A vs Run B)의 모든 요소(스팬, 프롬프트 입력, 모델 출력, CLI 플래그, 파이프라인 코드)를
 * GitHub Split Diff 스타일로 1:1 정밀 대조합니다.
 * Google TypeScript Style Guide 규칙(readonly 불변성, JSDoc, 명시적 반환 타입)을 준수합니다.
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  Clock,
  Coins,
  Cpu,
  FileCode,
  FileJson,
  FileText,
  Layers,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react'
import { fetchRunDetail, fetchSourceCode } from '../api'
import type { CompareItem, RunDetail, RunSummary, SpanRecord } from '../types'
import { DiffViewer } from './DiffViewer'

export interface RunCompareViewProps {
  readonly runs: readonly RunSummary[]
  readonly initialRunAId: string | null
  readonly initialRunBId: string | null
  readonly onSelectRunA?: (runId: string) => void
  readonly onSelectRunB?: (runId: string) => void
  readonly customSlotA?: CompareItem | null
  readonly customSlotB?: CompareItem | null
  readonly onClearCustomSlots?: () => void
}

type DiffCategory = 'inputs' | 'outputs' | 'config' | 'code' | 'raw' | 'overview'

interface SpanPair {
  readonly id: string
  readonly name: string
  readonly displayLabel: string
  readonly spanA?: SpanRecord
  readonly spanB?: SpanRecord
  readonly matchType: 'matched' | 'only_a' | 'only_b'
  readonly durationDiffMs: number
  readonly tokenDiff: number
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatToken(count: number): string {
  if (!count) return '0'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return count.toLocaleString()
}

function stringifyValue(val: unknown): string {
  if (val === undefined || val === null) return ''
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

/**
 * 스팬의 inputs 객체에서 사용자 프롬프트 본문 또는 주요 텍스트를 우선 추출하고,
 * 없으면 전체 JSON 문자열로 변환합니다.
 */
function extractSpanInputs(span?: SpanRecord): { text: string; language: string } {
  if (!span || !span.inputs) {
    return { text: '(입력 데이터 없음)', language: 'text' }
  }

  const inputs = span.inputs
  // 단일 prompt 또는 message 필드가 긴 문자열로 존재하는 경우
  if (typeof inputs.prompt === 'string') {
    return { text: inputs.prompt, language: 'markdown' }
  }
  if (typeof inputs.user_prompt === 'string') {
    return { text: inputs.user_prompt, language: 'markdown' }
  }
  if (typeof inputs.content === 'string') {
    return { text: inputs.content, language: 'markdown' }
  }

  return { text: JSON.stringify(inputs, null, 2), language: 'json' }
}

/**
 * 스팬의 outputs 객체에서 주요 출력(생성된 텍스트, 구조화된 결과물)을 추출합니다.
 */
function extractSpanOutputs(span?: SpanRecord): { text: string; language: string } {
  if (!span || !span.outputs) {
    return { text: '(출력 데이터 없음)', language: 'text' }
  }

  const outputs = span.outputs
  if (typeof outputs.raw_response === 'string') {
    return { text: outputs.raw_response, language: 'markdown' }
  }
  if (typeof outputs.text === 'string') {
    return { text: outputs.text, language: 'markdown' }
  }
  if (typeof outputs.result === 'string') {
    return { text: outputs.result, language: 'markdown' }
  }

  return { text: JSON.stringify(outputs, null, 2), language: 'json' }
}

/**
 * 스팬의 설정, 플래그, LLM 매트릭스 정보를 추출합니다.
 */
function extractSpanConfig(span?: SpanRecord): { text: string; language: string } {
  if (!span) return { text: '(설정 정보 없음)', language: 'text' }

  const configObj = {
    span_id: span.span_id,
    name: span.name,
    span_type: span.span_type,
    phase: span.phase,
    status: span.status,
    duration_ms: span.duration_ms,
    usage: span.usage,
    metadata: span.metadata,
    attempts: span.attempts?.map((a) => ({
      provider: a.provider,
      model: a.model,
      duration_ms: a.duration_ms,
      status: a.status,
      tokens: {
        input: a.input_tokens,
        output: a.output_tokens,
        thinking: a.thinking_tokens,
      },
      exit_code: a.exit_code,
      raw_command: a.raw_command,
    })),
  }

  return { text: JSON.stringify(configObj, null, 2), language: 'json' }
}

export const RunCompareView: React.FC<RunCompareViewProps> = ({
  runs,
  initialRunAId,
  initialRunBId,
  onSelectRunA,
  onSelectRunB,
  customSlotA,
  customSlotB,
}) => {
  const [runAId, setRunAId] = useState<string | null>(initialRunAId || runs[0]?.run_id || null)
  const [runBId, setRunBId] = useState<string | null>(
    initialRunBId || runs[1]?.run_id || runs[0]?.run_id || null
  )

  const [detailA, setDetailA] = useState<RunDetail | null>(null)
  const [detailB, setDetailB] = useState<RunDetail | null>(null)
  const [loadingA, setLoadingA] = useState<boolean>(false)
  const [loadingB, setLoadingB] = useState<boolean>(false)

  const hasCustomSlots = Boolean(customSlotA && customSlotB)
  const [selectedCategory, setSelectedCategory] = useState<DiffCategory>('inputs')
  const [selectedPairId, setSelectedPairId] = useState<string>(
    hasCustomSlots ? 'custom' : 'overview'
  )

  useEffect(() => {
    if (customSlotA && customSlotB) {
      setSelectedPairId('custom')
    }
  }, [customSlotA, customSlotB])

  const [codeSourceA, setCodeSourceA] = useState<string>('')
  const [codeSourceB, setCodeSourceB] = useState<string>('')
  const [loadingCode, setLoadingCode] = useState<boolean>(false)

  // Run Summary 찾기
  const summaryA = useMemo(() => runs.find((r) => r.run_id === runAId), [runs, runAId])
  const summaryB = useMemo(() => runs.find((r) => r.run_id === runBId), [runs, runBId])

  // Run A 상세 로드
  useEffect(() => {
    if (!runAId) {
      setDetailA(null)
      return
    }
    let cancelled = false
    setLoadingA(true)
    fetchRunDetail(runAId)
      .then((data) => {
        if (!cancelled) setDetailA(data)
      })
      .catch((err) => console.error('Failed to load Run A detail:', err))
      .finally(() => {
        if (!cancelled) setLoadingA(false)
      })
    return () => {
      cancelled = true
    }
  }, [runAId])

  // Run B 상세 로드
  useEffect(() => {
    if (!runBId) {
      setDetailB(null)
      return
    }
    let cancelled = false
    setLoadingB(true)
    fetchRunDetail(runBId)
      .then((data) => {
        if (!cancelled) setDetailB(data)
      })
      .catch((err) => console.error('Failed to load Run B detail:', err))
      .finally(() => {
        if (!cancelled) setLoadingB(false)
      })
    return () => {
      cancelled = true
    }
  }, [runBId])

  // A와 B 스왑 핸들러
  const handleSwap = () => {
    const prevA = runAId
    const prevB = runBId
    setRunAId(prevB)
    setRunBId(prevA)
    if (onSelectRunA && prevB) onSelectRunA(prevB)
    if (onSelectRunB && prevA) onSelectRunB(prevA)
  }

  // Spans 지능형 1:1 매칭
  const spanPairs: readonly SpanPair[] = useMemo(() => {
    if (!detailA && !detailB) return []

    const spansA = detailA?.spans ?? []
    const spansB = detailB?.spans ?? []

    const pairs: SpanPair[] = []
    const usedSpanBIds = new Set<string>()

    // 1단계: Run A 기준으로 B에서 이름 또는 라벨이 일치하는 스팬 매칭
    for (const spanA of spansA) {
      const matchIndex = spansB.findIndex(
        (b) =>
          !usedSpanBIds.has(b.span_id) &&
          (b.name === spanA.name ||
            (b.display_label && spanA.display_label && b.display_label === spanA.display_label))
      )

      if (matchIndex !== -1) {
        const spanB = spansB[matchIndex]
        usedSpanBIds.add(spanB.span_id)
        const durDiff = (spanB.duration_ms || 0) - (spanA.duration_ms || 0)
        const tokensA = (spanA.usage?.total_tokens as number) || 0
        const tokensB = (spanB.usage?.total_tokens as number) || 0

        pairs.push({
          id: `pair-${spanA.span_id}-${spanB.span_id}`,
          name: spanA.name,
          displayLabel: spanA.display_label || spanA.name,
          spanA,
          spanB,
          matchType: 'matched',
          durationDiffMs: durDiff,
          tokenDiff: tokensB - tokensA,
        })
      } else {
        pairs.push({
          id: `pair-a-${spanA.span_id}`,
          name: spanA.name,
          displayLabel: spanA.display_label || spanA.name,
          spanA,
          spanB: undefined,
          matchType: 'only_a',
          durationDiffMs: -(spanA.duration_ms || 0),
          tokenDiff: -((spanA.usage?.total_tokens as number) || 0),
        })
      }
    }

    // 2단계: Run B에만 존재하는 남은 스팬들 추가
    for (const spanB of spansB) {
      if (!usedSpanBIds.has(spanB.span_id)) {
        pairs.push({
          id: `pair-b-${spanB.span_id}`,
          name: spanB.name,
          displayLabel: spanB.display_label || spanB.name,
          spanA: undefined,
          spanB,
          matchType: 'only_b',
          durationDiffMs: spanB.duration_ms || 0,
          tokenDiff: (spanB.usage?.total_tokens as number) || 0,
        })
      }
    }

    return pairs
  }, [detailA, detailB])

  // 현재 선택된 SpanPair
  const selectedPair = useMemo(() => {
    if (selectedPairId === 'overview') return null
    return spanPairs.find((p) => p.id === selectedPairId) || null
  }, [spanPairs, selectedPairId])

  // 소스코드 로드 (code 카테고리 선택 시)
  useEffect(() => {
    if (selectedCategory !== 'code') return

    const sourceFileA =
      (selectedPair?.spanA?.metadata?.source_file as string) ||
      (detailA?.meta?.source_file as string) ||
      ''
    const sourceSymbolA = selectedPair?.spanA?.metadata?.source_symbol as string | undefined

    const sourceFileB =
      (selectedPair?.spanB?.metadata?.source_file as string) ||
      (detailB?.meta?.source_file as string) ||
      ''
    const sourceSymbolB = selectedPair?.spanB?.metadata?.source_symbol as string | undefined

    if (!sourceFileA && !sourceFileB) {
      setCodeSourceA('// 이 스팬과 연관된 소스코드 정보가 메타데이터에 등록되지 않았습니다.')
      setCodeSourceB('// 이 스팬과 연관된 소스코드 정보가 메타데이터에 등록되지 않았습니다.')
      return
    }

    setLoadingCode(true)
    Promise.all([
      sourceFileA ? fetchSourceCode(sourceFileA, sourceSymbolA) : Promise.resolve(null),
      sourceFileB ? fetchSourceCode(sourceFileB, sourceSymbolB) : Promise.resolve(null),
    ])
      .then(([resA, resB]) => {
        setCodeSourceA(resA?.content || '// 소스코드를 찾을 수 없습니다.')
        setCodeSourceB(resB?.content || '// 소스코드를 찾을 수 없습니다.')
      })
      .catch((err) => {
        console.error('Failed to load source code for diff:', err)
        setCodeSourceA('// 소스코드 로드 실패')
        setCodeSourceB('// 소스코드 로드 실패')
      })
      .finally(() => {
        setLoadingCode(false)
      })
  }, [selectedCategory, selectedPair, detailA, detailB])

  // 선택된 카테고리에 따른 Old(A) / New(B) 텍스트 및 언어 계산
  const diffPayload = useMemo(() => {
    if (selectedPairId === 'custom' && customSlotA && customSlotB) {
      return {
        oldText: customSlotA.content,
        newText: customSlotB.content,
        language: customSlotA.language || customSlotB.language || 'text',
      }
    }

    if (selectedPairId === 'overview' || selectedCategory === 'overview') {
      const overviewA = {
        meta: detailA?.meta || summaryA,
        total_duration_ms: summaryA?.total_duration_ms,
        total_tokens: summaryA?.total_tokens,
        input_tokens: summaryA?.input_tokens,
        output_tokens: summaryA?.output_tokens,
        model: summaryA?.primary_model,
        provider: summaryA?.primary_provider,
        cost_usd: summaryA?.cost_usd,
        status: summaryA?.status,
        created_at: summaryA?.created_at,
        spans_count: detailA?.spans.length,
      }
      const overviewB = {
        meta: detailB?.meta || summaryB,
        total_duration_ms: summaryB?.total_duration_ms,
        total_tokens: summaryB?.total_tokens,
        input_tokens: summaryB?.input_tokens,
        output_tokens: summaryB?.output_tokens,
        model: summaryB?.primary_model,
        provider: summaryB?.primary_provider,
        cost_usd: summaryB?.cost_usd,
        status: summaryB?.status,
        created_at: summaryB?.created_at,
        spans_count: detailB?.spans.length,
      }
      return {
        oldText: stringifyValue(overviewA),
        newText: stringifyValue(overviewB),
        language: 'json',
      }
    }

    const spanA = selectedPair?.spanA
    const spanB = selectedPair?.spanB

    switch (selectedCategory) {
      case 'inputs': {
        const a = extractSpanInputs(spanA)
        const b = extractSpanInputs(spanB)
        return {
          oldText: a.text,
          newText: b.text,
          language: a.language === 'markdown' || b.language === 'markdown' ? 'markdown' : a.language,
        }
      }
      case 'outputs': {
        const a = extractSpanOutputs(spanA)
        const b = extractSpanOutputs(spanB)
        return {
          oldText: a.text,
          newText: b.text,
          language: a.language === 'markdown' || b.language === 'markdown' ? 'markdown' : a.language,
        }
      }
      case 'config': {
        const a = extractSpanConfig(spanA)
        const b = extractSpanConfig(spanB)
        return {
          oldText: a.text,
          newText: b.text,
          language: 'json',
        }
      }
      case 'code': {
        return {
          oldText: codeSourceA,
          newText: codeSourceB,
          language: 'python',
        }
      }
      case 'raw':
      default: {
        return {
          oldText: stringifyValue(spanA || { note: '스팬 A 없음' }),
          newText: stringifyValue(spanB || { note: '스팬 B 없음' }),
          language: 'json',
        }
      }
    }
  }, [
    selectedPairId,
    selectedCategory,
    detailA,
    detailB,
    summaryA,
    summaryB,
    selectedPair,
    codeSourceA,
    codeSourceB,
    customSlotA,
    customSlotB,
  ])

  // Delta 지표 계산
  const metricsDelta = useMemo(() => {
    if (!summaryA || !summaryB) return null
    const durDelta = summaryB.total_duration_ms - summaryA.total_duration_ms
    const durPct = summaryA.total_duration_ms > 0 ? (durDelta / summaryA.total_duration_ms) * 100 : 0
    const inTokensDelta = summaryB.input_tokens - summaryA.input_tokens
    const outTokensDelta = summaryB.output_tokens - summaryA.output_tokens
    const costDelta = summaryB.cost_usd - summaryA.cost_usd

    return {
      durDelta,
      durPct,
      inTokensDelta,
      outTokensDelta,
      costDelta,
    }
  }, [summaryA, summaryB])

  const labelA = summaryA?.workflow_label || summaryA?.task_name || runAId?.slice(0, 8) || 'Run A'
  const labelB = summaryB?.workflow_label || summaryB?.task_name || runBId?.slice(0, 8) || 'Run B'

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden text-[#e6edf3]">
      {/* 1. Header: Run A vs Run B Selectors & KPI Delta Dashboard */}
      <div className="bg-[#161b22] border-b border-[#30363d] p-3.5 shrink-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Run Selectors (GitHub Branch Compare Look & Feel) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Run A Selector (Base) */}
            <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-[rgba(248,81,73,0.2)] text-[#f85149] flex items-center justify-center font-mono font-bold text-xs">
                🅰️
              </span>
              <span className="text-[11px] font-semibold text-[#f85149]">base:</span>
              <select
                value={runAId || ''}
                onChange={(e) => {
                  const newId = e.target.value
                  setRunAId(newId)
                  if (onSelectRunA) onSelectRunA(newId)
                }}
                className="bg-transparent text-xs text-[#e6edf3] font-mono outline-none cursor-pointer max-w-[220px] truncate"
              >
                {runs.map((r) => (
                  <option key={r.run_id} value={r.run_id} className="bg-[#161b22] text-[#e6edf3]">
                    [{r.workflow_label || r.task_name}] {r.primary_model || ''} ({r.run_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#848d97] hover:text-[#e6edf3] transition-colors border border-[#30363d] cursor-pointer"
              title="A와 B의 기준/비교 위치 교체 (Swap)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Run B Selector (Target) */}
            <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-[rgba(46,160,67,0.2)] text-[#3fb950] flex items-center justify-center font-mono font-bold text-xs">
                🅱️
              </span>
              <span className="text-[11px] font-semibold text-[#3fb950]">compare:</span>
              <select
                value={runBId || ''}
                onChange={(e) => {
                  const newId = e.target.value
                  setRunBId(newId)
                  if (onSelectRunB) onSelectRunB(newId)
                }}
                className="bg-transparent text-xs text-[#e6edf3] font-mono outline-none cursor-pointer max-w-[220px] truncate"
              >
                {runs.map((r) => (
                  <option key={r.run_id} value={r.run_id} className="bg-[#161b22] text-[#e6edf3]">
                    [{r.workflow_label || r.task_name}] {r.primary_model || ''} ({r.run_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Info & State Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#848d97]">
            {(loadingA || loadingB || loadingCode) && (
              <span className="flex items-center gap-1.5 text-[#58a6ff]">
                <Zap className="w-3 h-3 animate-spin" />
                대조 분석 중...
              </span>
            )}
          </div>
        </div>

        {/* Delta Metrics KPI Bar */}
        {summaryA && summaryB && metricsDelta && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. 소요 시간 대조 */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] text-[#848d97]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#848d97]" /> 소요 시간 (Duration)
                </span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    metricsDelta.durDelta <= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'
                  }`}
                >
                  {metricsDelta.durDelta <= 0 ? '▼ 더 빠름' : '▲ 더 느림'}{' '}
                  {Math.abs(metricsDelta.durPct).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] mt-0.5">
                <span className="text-[#f85149]">🅰️ {formatDuration(summaryA.total_duration_ms)}</span>
                <span className="text-[#6e7681]">vs</span>
                <span className="text-[#3fb950]">
                  🅱️ {formatDuration(summaryB.total_duration_ms)}
                </span>
              </div>
            </div>

            {/* 2. 입력 토큰 대조 */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] text-[#848d97]">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-[#58a6ff]" /> 입력 토큰 (Prompt)
                </span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    metricsDelta.inTokensDelta <= 0 ? 'text-[#3fb950]' : 'text-[#d29922]'
                  }`}
                >
                  Δ {metricsDelta.inTokensDelta > 0 ? '+' : ''}
                  {formatToken(metricsDelta.inTokensDelta)}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] mt-0.5">
                <span className="text-[#f85149]">🅰️ {formatToken(summaryA.input_tokens)}</span>
                <span className="text-[#6e7681]">vs</span>
                <span className="text-[#3fb950]">🅱️ {formatToken(summaryB.input_tokens)}</span>
              </div>
            </div>

            {/* 3. 출력 토큰 대조 */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] text-[#848d97]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#3fb950]" /> 출력 토큰 (Output)
                </span>
                <span className="font-mono text-[10px] font-bold text-[#e6edf3]">
                  Δ {metricsDelta.outTokensDelta > 0 ? '+' : ''}
                  {formatToken(metricsDelta.outTokensDelta)}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] mt-0.5">
                <span className="text-[#f85149]">🅰️ {formatToken(summaryA.output_tokens)}</span>
                <span className="text-[#6e7681]">vs</span>
                <span className="text-[#3fb950]">🅱️ {formatToken(summaryB.output_tokens)}</span>
              </div>
            </div>

            {/* 4. 모델 & 엔진 대조 */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] text-[#848d97]">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#58a6ff]" /> 주력 모델 (Model)
                </span>
                <span className="font-mono text-[10px] text-[#848d97]">
                  {summaryA.primary_model === summaryB.primary_model ? '동일 모델' : 'A/B 비교'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] mt-0.5 truncate">
                <span className="text-[#f85149] truncate max-w-[90px]">
                  🅰️ {summaryA.primary_model?.replace('gemini-', '') || 'None'}
                </span>
                <span className="text-[#6e7681]">vs</span>
                <span className="text-[#3fb950] truncate max-w-[90px]">
                  🅱️ {summaryB.primary_model?.replace('gemini-', '') || 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Body: Left Span Mapping Sidebar & Right Element Diff Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Span 1:1 Mapping Tree */}
        <div className="w-72 lg:w-80 bg-[#0d1117] border-r border-[#30363d] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e6edf3] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
              Trace Elements ({spanPairs.length + 1})
            </span>
            <span className="text-[10px] text-[#848d97] font-mono">1:1 Pair Match</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#21262d]/60 p-1.5 space-y-1">
            {/* Top Item: Custom 2-Card Compare */}
            {customSlotA && customSlotB && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPairId('custom')}
                className={`p-2.5 rounded-md cursor-pointer transition-all text-xs flex items-center justify-between mb-1.5 ${
                  selectedPairId === 'custom'
                    ? 'bg-[#161b22] border-l-2 border-l-[#58a6ff] border-[#30363d] text-[#e6edf3] font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]/50 border border-[#30363d]/60 bg-[#161b22]/20'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs">⚖️</span>
                  <div className="truncate">
                    <div className="font-semibold text-[#58a6ff] truncate">
                      픽된 2개 카드 1:1 대조
                    </div>
                    <div className="text-[10px] text-[#848d97] truncate">
                      {customSlotA.title} vs {customSlotB.title}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold shrink-0">
                  Custom
                </span>
              </div>
            )}

            {/* Item 2: Run Overview */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedPairId('overview')
                setSelectedCategory('overview')
              }}
              className={`p-2.5 rounded-md cursor-pointer transition-colors text-xs flex items-center justify-between ${
                selectedPairId === 'overview'
                  ? 'bg-[#161b22] border-l-2 border-l-[#58a6ff] text-[#e6edf3] font-medium'
                  : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]/40'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Sliders className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                <span className="truncate">전체 실행 개요 (Run Overview)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#848d97] border border-[#30363d] shrink-0">
                Summary
              </span>
            </div>

            {/* Matched / Unmatched Span Pairs */}
            {spanPairs.map((pair) => {
              const isSelected = selectedPairId === pair.id
              const isMatched = pair.matchType === 'matched'
              const isOnlyA = pair.matchType === 'only_a'

              return (
                <div
                  key={pair.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedPairId(pair.id)
                    if (selectedCategory === 'overview') {
                      setSelectedCategory('inputs')
                    }
                  }}
                  className={`p-2.5 rounded-md cursor-pointer transition-colors text-xs flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#161b22] border-l-2 border-l-[#58a6ff] text-[#e6edf3]'
                      : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]/40 border border-transparent'
                  }`}
                >
                  {/* Pair Header: Label & Status Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-medium truncate text-[#e6edf3]">
                      {pair.displayLabel}
                    </div>
                    {isMatched ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[rgba(46,160,67,0.15)] text-[#3fb950] border border-[rgba(46,160,67,0.3)] shrink-0">
                        1:1 Matched
                      </span>
                    ) : isOnlyA ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[rgba(248,81,73,0.15)] text-[#f85149] border border-[rgba(248,81,73,0.3)] shrink-0">
                        Only in 🅰️
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[rgba(46,160,67,0.15)] text-[#3fb950] border border-[rgba(46,160,67,0.3)] shrink-0">
                        Only in 🅱️
                      </span>
                    )}
                  </div>

                  {/* Pair Subtitle: System Span Name */}
                  <div className="font-mono text-[10px] text-[#848d97] truncate">
                    {pair.name}
                  </div>

                  {/* Pair Metrics Delta */}
                  {isMatched && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#848d97] pt-1 border-t border-[#30363d]/60">
                      <span
                        className={
                          pair.durationDiffMs <= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'
                        }
                      >
                        ⏱️ {pair.durationDiffMs > 0 ? '+' : ''}
                        {formatDuration(pair.durationDiffMs)}
                      </span>
                      {pair.tokenDiff !== 0 && (
                        <span
                          className={
                            pair.tokenDiff <= 0 ? 'text-[#3fb950]' : 'text-[#d29922]'
                          }
                        >
                          🪙 {pair.tokenDiff > 0 ? '+' : ''}
                          {formatToken(pair.tokenDiff)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Main Content: Element Category Tabs & Split Diff Viewer */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d1117] p-3.5 gap-3">
          {/* Sub Navigation: Element Categories (GitHub Style SubNav) */}
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('inputs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'inputs'
                    ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                📥 Inputs & Prompts
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('outputs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'outputs'
                    ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                📤 Outputs & Results
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'config'
                    ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                ⚙️ Config & Flags
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'code'
                    ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                💻 Pipeline Source
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'raw'
                    ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                    : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                🪵 Raw Span JSON
              </button>
            </div>

            {/* Target Label Display */}
            <div className="text-xs font-mono text-[#848d97] hidden md:flex items-center gap-2">
              <span>대조 타겟:</span>
              <span className="text-[#58a6ff] font-semibold">
                {selectedPairId === 'custom'
                  ? '선택된 2개 카드 1:1 대조'
                  : selectedPair
                  ? selectedPair.displayLabel
                  : '전체 실행 개요 (Run Overview)'}
              </span>
            </div>
          </div>

          {/* GitHub Split Diff Viewer */}
          <div className="flex-1 overflow-hidden">
            <DiffViewer
              oldText={diffPayload.oldText}
              newText={diffPayload.newText}
              oldTitle={
                selectedPairId === 'custom' && customSlotA
                  ? `🅰️ ${customSlotA.title}`
                  : `🅰️ ${labelA} (${summaryA?.primary_model || 'Run A'})`
              }
              newTitle={
                selectedPairId === 'custom' && customSlotB
                  ? `🅱️ ${customSlotB.title}`
                  : `🅱️ ${labelB} (${summaryB?.primary_model || 'Run B'})`
              }
              language={diffPayload.language}
              initialMode="split"
              maxHeight="calc(100vh - 270px)"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export default RunCompareView
