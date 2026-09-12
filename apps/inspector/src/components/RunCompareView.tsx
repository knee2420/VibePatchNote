/**
 * @fileoverview RunCompareView - 1:1 정밀 대조 뷰어
 * 사용자가 선택한 두 대상(픽된 2개 카드 또는 Run A vs Run B)을
 * 불필요한 군더더기 없이 전체 화면 GitHub Split/Unified Diff로 깔끔하게 1:1 대조합니다.
 * Google TypeScript Style Guide 규칙을 준수합니다.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, RotateCcw, Zap } from 'lucide-react'
import { fetchRunDetail } from '../api'
import type { CompareItem, RunDetail, RunSummary } from '../types'
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
  readonly onSwapCustomSlots?: () => void
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

export const RunCompareView: React.FC<RunCompareViewProps> = ({
  runs,
  initialRunAId,
  initialRunBId,
  onSelectRunA,
  onSelectRunB,
  customSlotA,
  customSlotB,
  onClearCustomSlots,
  onSwapCustomSlots,
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

  // Run A 상세 정보 로드
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

  // Run B 상세 정보 로드
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
    if (hasCustomSlots && onSwapCustomSlots) {
      onSwapCustomSlots()
      return
    }
    const prevA = runAId
    const prevB = runBId
    setRunAId(prevB)
    setRunBId(prevA)
    if (onSelectRunA && prevB) onSelectRunA(prevB)
    if (onSelectRunB && prevA) onSelectRunB(prevA)
  }

  const summaryA = useMemo(() => runs.find((r) => r.run_id === runAId), [runs, runAId])
  const summaryB = useMemo(() => runs.find((r) => r.run_id === runBId), [runs, runBId])

  const labelA = summaryA?.workflow_label || summaryA?.task_name || runAId?.slice(0, 8) || 'Run A'
  const labelB = summaryB?.workflow_label || summaryB?.task_name || runBId?.slice(0, 8) || 'Run B'

  // 대조할 Old(A) / New(B) 텍스트 및 언어 계산
  const diffPayload = useMemo(() => {
    // 1. 사용자가 직접 픽한 2개 카드가 있을 때: 1:1 직결 비교
    if (customSlotA && customSlotB) {
      return {
        oldText: customSlotA.content,
        newText: customSlotB.content,
        oldTitle: customSlotA.title,
        newTitle: customSlotB.title,
        oldSubtitle: customSlotA.subtitle,
        newSubtitle: customSlotB.subtitle,
        language: customSlotA.language || customSlotB.language || 'text',
      }
    }

    // 2. 픽된 카드가 없을 때: Run A vs Run B의 종합 실행 개요 비교
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
      spans_count: detailA?.spans?.length,
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
      spans_count: detailB?.spans?.length,
    }

    return {
      oldText: stringifyValue(overviewA),
      newText: stringifyValue(overviewB),
      oldTitle: `${labelA} (${summaryA?.primary_model || 'Run A'})`,
      newTitle: `${labelB} (${summaryB?.primary_model || 'Run B'})`,
      oldSubtitle: summaryA?.run_id ? `ID: ${summaryA.run_id}` : undefined,
      newSubtitle: summaryB?.run_id ? `ID: ${summaryB.run_id}` : undefined,
      language: 'json',
    }
  }, [customSlotA, customSlotB, detailA, detailB, summaryA, summaryB, labelA, labelB])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden text-[#e6edf3]">
      {/* 1. Header Bar: GitHub Branch / PR Compare 룩앤필 */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 shrink-0 flex items-center justify-between gap-3">
        {hasCustomSlots && customSlotA && customSlotB ? (
          /* Case A: 사용자가 직접 픽한 2개 카드 1:1 대조 모드 */
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            {/* Slot A Indicator */}
            <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1 text-xs min-w-0">
              <span className="w-4 h-4 rounded-full bg-[rgba(248,81,73,0.2)] text-[#f85149] flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                🅰️
              </span>
              <span className="text-[#f85149] font-medium truncate max-w-[240px]" title={customSlotA.title}>
                {customSlotA.title}
              </span>
              {customSlotA.subtitle && (
                <span className="text-[10px] text-[#848d97] font-mono truncate max-w-[160px]">
                  ({customSlotA.subtitle})
                </span>
              )}
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="p-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#848d97] hover:text-[#e6edf3] transition-colors border border-[#30363d] cursor-pointer"
              title="A와 B의 위치 교체 (Swap)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Slot B Indicator */}
            <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1 text-xs min-w-0">
              <span className="w-4 h-4 rounded-full bg-[rgba(46,160,67,0.2)] text-[#3fb950] flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                🅱️
              </span>
              <span className="text-[#3fb950] font-medium truncate max-w-[240px]" title={customSlotB.title}>
                {customSlotB.title}
              </span>
              {customSlotB.subtitle && (
                <span className="text-[10px] text-[#848d97] font-mono truncate max-w-[160px]">
                  ({customSlotB.subtitle})
                </span>
              )}
            </div>

            {/* 초기화 / 해제 버튼 */}
            {onClearCustomSlots && (
              <button
                type="button"
                onClick={onClearCustomSlots}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#848d97] hover:text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer"
                title="선택된 카드를 해제하고 기본 런 비교로 돌아가기"
              >
                <RotateCcw className="w-3 h-3" />
                <span>선택 해제</span>
              </button>
            )}
          </div>
        ) : (
          /* Case B: 기본 런 선택 모드 */
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
                className="bg-transparent text-xs text-[#e6edf3] font-mono outline-none cursor-pointer max-w-[240px] truncate"
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
                className="bg-transparent text-xs text-[#e6edf3] font-mono outline-none cursor-pointer max-w-[240px] truncate"
              >
                {runs.map((r) => (
                  <option key={r.run_id} value={r.run_id} className="bg-[#161b22] text-[#e6edf3]">
                    [{r.workflow_label || r.task_name}] {r.primary_model || ''} ({r.run_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* State Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#848d97]">
          {(loadingA || loadingB) && (
            <span className="flex items-center gap-1.5 text-[#58a6ff]">
              <Zap className="w-3 h-3 animate-spin" />
              로딩 중...
            </span>
          )}
          {hasCustomSlots && (
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                customSlotA?.type === 'workflow'
                  ? 'bg-[#8957e5]/20 text-[#bc8cff] border-[#8957e5]/40'
                  : 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/30'
              }`}
            >
              {customSlotA?.type === 'workflow'
                ? '1:1 워크플로우 플로우 대조'
                : '1:1 Custom Diff'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Full Diff Viewer Area */}
      <div className="flex-1 overflow-hidden p-3 bg-[#0d1117]">
        <DiffViewer
          oldText={diffPayload.oldText}
          newText={diffPayload.newText}
          oldTitle={`🅰️ ${diffPayload.oldTitle}`}
          newTitle={`🅱️ ${diffPayload.newTitle}`}
          language={diffPayload.language}
          initialMode="split"
          maxHeight="calc(100vh - 120px)"
        />
      </div>
    </div>
  )
}

export default RunCompareView
