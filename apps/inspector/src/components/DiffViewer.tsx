/**
 * @fileoverview GitHub 스타일 Split & Unified Diff 뷰어 컴포넌트
 * 두 문자열(또는 JSON) 간의 차이점을 좌우 분할(Split) 또는 단일 통합(Unified) 모드로 시각화합니다.
 * Google TypeScript Style Guide 규칙(readonly 불변성, JSDoc, 명시적 반환 타입)을 준수합니다.
 */

import React, { useMemo, useState } from 'react'
import { Check, Columns2, Copy, FileText, Rows2 } from 'lucide-react'
import { diffLines, type Change } from 'diff'

export interface DiffViewerProps {
  readonly oldText: string
  readonly newText: string
  readonly oldTitle?: string
  readonly newTitle?: string
  readonly language?: string
  readonly initialMode?: 'split' | 'unified'
  readonly maxHeight?: string
}

interface SplitRow {
  readonly id: string
  readonly leftNum: number | null
  readonly leftContent: string
  readonly leftType: 'removed' | 'normal' | 'empty'
  readonly rightNum: number | null
  readonly rightContent: string
  readonly rightType: 'added' | 'normal' | 'empty'
}

interface UnifiedRow {
  readonly id: string
  readonly leftNum: number | null
  readonly rightNum: number | null
  readonly content: string
  readonly type: 'added' | 'removed' | 'normal'
}

/**
 * diffLines의 변경 사항 배열을 좌우 나란히 표시 가능한 SplitRow 배열로 변환합니다.
 */
function buildSplitRows(changes: readonly Change[]): readonly SplitRow[] {
  const rows: SplitRow[] = []
  let leftLine = 1
  let rightLine = 1
  let rowCounter = 0

  let pendingRemoved: string[] = []
  let pendingAdded: string[] = []

  const flushPending = () => {
    const maxLen = Math.max(pendingRemoved.length, pendingAdded.length)
    for (let i = 0; i < maxLen; i++) {
      const hasLeft = i < pendingRemoved.length
      const hasRight = i < pendingAdded.length

      rows.push({
        id: `split-${rowCounter++}`,
        leftNum: hasLeft ? leftLine++ : null,
        leftContent: hasLeft ? pendingRemoved[i] : '',
        leftType: hasLeft ? 'removed' : 'empty',
        rightNum: hasRight ? rightLine++ : null,
        rightContent: hasRight ? pendingAdded[i] : '',
        rightType: hasRight ? 'added' : 'empty',
      })
    }
    pendingRemoved = []
    pendingAdded = []
  }

  for (const change of changes) {
    // 줄바꿈으로 라인 분리 (마지막 빈 라인 제거)
    const rawLines = change.value.split('\n')
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
      rawLines.pop()
    }

    if (change.removed) {
      pendingRemoved.push(...rawLines)
    } else if (change.added) {
      pendingAdded.push(...rawLines)
    } else {
      flushPending()
      for (const line of rawLines) {
        rows.push({
          id: `split-${rowCounter++}`,
          leftNum: leftLine++,
          leftContent: line,
          leftType: 'normal',
          rightNum: rightLine++,
          rightContent: line,
          rightType: 'normal',
        })
      }
    }
  }

  flushPending()
  return rows
}

/**
 * diffLines의 변경 사항 배열을 UnifiedRow 배열로 변환합니다.
 */
function buildUnifiedRows(changes: readonly Change[]): readonly UnifiedRow[] {
  const rows: UnifiedRow[] = []
  let leftLine = 1
  let rightLine = 1
  let rowCounter = 0

  for (const change of changes) {
    const rawLines = change.value.split('\n')
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
      rawLines.pop()
    }

    for (const line of rawLines) {
      if (change.removed) {
        rows.push({
          id: `uni-${rowCounter++}`,
          leftNum: leftLine++,
          rightNum: null,
          content: line,
          type: 'removed',
        })
      } else if (change.added) {
        rows.push({
          id: `uni-${rowCounter++}`,
          leftNum: null,
          rightNum: rightLine++,
          content: line,
          type: 'added',
        })
      } else {
        rows.push({
          id: `uni-${rowCounter++}`,
          leftNum: leftLine++,
          rightNum: rightLine++,
          content: line,
          type: 'normal',
        })
      }
    }
  }

  return rows
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  oldTitle = 'Run A (Base)',
  newTitle = 'Run B (Target)',
  language = 'text',
  initialMode = 'split',
  maxHeight = 'calc(100vh - 280px)',
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(initialMode)
  const [copiedSide, setCopiedSide] = useState<'old' | 'new' | null>(null)

  // diff 계산
  const { changes, stats } = useMemo(() => {
    const diff = diffLines(oldText || '', newText || '')
    let addedCount = 0
    let removedCount = 0
    let unchangedCount = 0

    for (const part of diff) {
      const lineCount = part.count ?? (part.value.split('\n').length - 1 || 1)
      if (part.added) {
        addedCount += lineCount
      } else if (part.removed) {
        removedCount += lineCount
      } else {
        unchangedCount += lineCount
      }
    }

    return {
      changes: diff,
      stats: { addedCount, removedCount, unchangedCount },
    }
  }, [oldText, newText])

  const splitRows = useMemo(() => {
    if (viewMode !== 'split') return []
    return buildSplitRows(changes)
  }, [changes, viewMode])

  const unifiedRows = useMemo(() => {
    if (viewMode !== 'unified') return []
    return buildUnifiedRows(changes)
  }, [changes, viewMode])

  const handleCopy = (side: 'old' | 'new', text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedSide(side)
    setTimeout(() => setCopiedSide(null), 1800)
  }

  const isIdentical = stats.addedCount === 0 && stats.removedCount === 0

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* Diff Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0e1628] border-b border-slate-800 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] text-slate-400">{language.toUpperCase()}</span>
          </div>

          {/* Diff Stats Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {isIdentical ? (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                일치 (No Differences)
              </span>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                  +{stats.addedCount} lines
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40 font-semibold">
                  -{stats.removedCount} lines
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  ({stats.unchangedCount} unchanged)
                </span>
              </>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Copy Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
                viewMode === 'split'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View (2열 분할 비교)"
            >
              <Columns2 className="w-3 h-3" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
                viewMode === 'unified'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Unified View (단일 통합 비교)"
            >
              <Rows2 className="w-3 h-3" />
              Unified
            </button>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => handleCopy('old', oldText)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              title="Run A 텍스트 복사"
            >
              {copiedSide === 'old' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy A
            </button>
            <button
              type="button"
              onClick={() => handleCopy('new', newText)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              title="Run B 텍스트 복사"
            >
              {copiedSide === 'new' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy B
            </button>
          </div>
        </div>
      </div>

      {/* Diff Table Headers (Split 모드) */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-2 border-b border-slate-800 bg-[#0c1222] font-mono text-[11px] shrink-0 divide-x divide-slate-800">
          <div className="px-4 py-1.5 flex items-center justify-between text-rose-300/90 font-medium">
            <span className="truncate">{oldTitle}</span>
            <span className="text-[10px] text-rose-400/70 font-sans">(-) Base / Previous</span>
          </div>
          <div className="px-4 py-1.5 flex items-center justify-between text-emerald-300/90 font-medium">
            <span className="truncate">{newTitle}</span>
            <span className="text-[10px] text-emerald-400/70 font-sans">(+) Target / New</span>
          </div>
        </div>
      )}

      {/* Main Diff Content Container */}
      <div
        className="flex-1 overflow-auto font-mono text-xs leading-5 select-text"
        style={{ maxHeight }}
      >
        {viewMode === 'split' ? (
          <div className="min-w-full inline-block divide-y divide-slate-900/60">
            {splitRows.map((row) => (
              <div key={row.id} className="grid grid-cols-2 divide-x divide-slate-800/80 group">
                {/* Left Column (Old/Base) */}
                <div
                  className={`flex items-start ${
                    row.leftType === 'removed'
                      ? 'bg-rose-950/35 text-rose-200'
                      : row.leftType === 'empty'
                      ? 'bg-slate-950/40 text-slate-600'
                      : 'text-slate-300 group-hover:bg-slate-900/40'
                  }`}
                >
                  <span
                    className={`w-12 shrink-0 select-none text-right pr-2.5 py-0.5 text-[10px] font-mono border-r border-slate-800/60 ${
                      row.leftType === 'removed'
                        ? 'bg-rose-950/60 text-rose-400/80'
                        : 'text-slate-600 bg-[#080d1a]'
                    }`}
                  >
                    {row.leftNum ?? ''}
                  </span>
                  <span className="w-5 shrink-0 select-none text-center py-0.5 text-xs">
                    {row.leftType === 'removed' ? '-' : ''}
                  </span>
                  <pre className="flex-1 py-0.5 px-2 overflow-x-auto whitespace-pre-wrap break-all font-mono font-normal">
                    {row.leftContent}
                  </pre>
                </div>

                {/* Right Column (New/Target) */}
                <div
                  className={`flex items-start ${
                    row.rightType === 'added'
                      ? 'bg-emerald-950/35 text-emerald-200'
                      : row.rightType === 'empty'
                      ? 'bg-slate-950/40 text-slate-600'
                      : 'text-slate-300 group-hover:bg-slate-900/40'
                  }`}
                >
                  <span
                    className={`w-12 shrink-0 select-none text-right pr-2.5 py-0.5 text-[10px] font-mono border-r border-slate-800/60 ${
                      row.rightType === 'added'
                        ? 'bg-emerald-950/60 text-emerald-400/80'
                        : 'text-slate-600 bg-[#080d1a]'
                    }`}
                  >
                    {row.rightNum ?? ''}
                  </span>
                  <span className="w-5 shrink-0 select-none text-center py-0.5 text-xs">
                    {row.rightType === 'added' ? '+' : ''}
                  </span>
                  <pre className="flex-1 py-0.5 px-2 overflow-x-auto whitespace-pre-wrap break-all font-mono font-normal">
                    {row.rightContent}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Unified View */
          <div className="min-w-full inline-block divide-y divide-slate-900/60">
            {unifiedRows.map((row) => {
              const isAdded = row.type === 'added'
              const isRemoved = row.type === 'removed'

              return (
                <div
                  key={row.id}
                  className={`flex items-start group ${
                    isAdded
                      ? 'bg-emerald-950/35 text-emerald-200'
                      : isRemoved
                      ? 'bg-rose-950/35 text-rose-200'
                      : 'text-slate-300 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Left Line Number */}
                  <span
                    className={`w-11 shrink-0 select-none text-right pr-2 py-0.5 text-[10px] font-mono border-r border-slate-800/60 ${
                      isRemoved
                        ? 'bg-rose-950/60 text-rose-400'
                        : 'text-slate-600 bg-[#080d1a]'
                    }`}
                  >
                    {row.leftNum ?? ''}
                  </span>

                  {/* Right Line Number */}
                  <span
                    className={`w-11 shrink-0 select-none text-right pr-2 py-0.5 text-[10px] font-mono border-r border-slate-800/60 ${
                      isAdded
                        ? 'bg-emerald-950/60 text-emerald-400'
                        : 'text-slate-600 bg-[#080d1a]'
                    }`}
                  >
                    {row.rightNum ?? ''}
                  </span>

                  {/* Marker (- / + / space) */}
                  <span
                    className={`w-6 shrink-0 select-none text-center py-0.5 font-bold ${
                      isAdded ? 'text-emerald-400' : isRemoved ? 'text-rose-400' : 'text-slate-600'
                    }`}
                  >
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </span>

                  {/* Content */}
                  <pre className="flex-1 py-0.5 px-2 overflow-x-auto whitespace-pre-wrap break-all font-mono font-normal">
                    {row.content}
                  </pre>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default DiffViewer
