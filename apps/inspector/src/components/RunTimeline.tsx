import React from 'react'
import {
  AlertTriangle,
  Bot,
  Braces,
  Cpu,
  Layers,
  Wrench,
  Zap,
} from 'lucide-react'
import type { SpanRecord, SpanType } from '../types'

interface RunTimelineProps {
  spans: SpanRecord[]
  selectedSpanId: string | null
  onSelectSpan: (spanId: string) => void
  totalDurationMs: number
}

function getSpanIcon(type: SpanType) {
  switch (type) {
    case 'llm':
      return <Bot className="w-3.5 h-3.5 text-purple-400" />
    case 'tool':
      return <Wrench className="w-3.5 h-3.5 text-amber-400" />
    case 'chain':
      return <Layers className="w-3.5 h-3.5 text-blue-400" />
    case 'parser':
      return <Braces className="w-3.5 h-3.5 text-emerald-400" />
    case 'workflow':
      return <Cpu className="w-3.5 h-3.5 text-cyan-400" />
    default:
      return <Zap className="w-3.5 h-3.5 text-slate-400" />
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

export const RunTimeline: React.FC<RunTimelineProps> = ({
  spans,
  selectedSpanId,
  onSelectSpan,
  totalDurationMs,
}) => {
  // Dotted order(계층형 ISO 타임스탬프) 기준으로 정렬
  const sortedSpans = [...spans].sort((a, b) => {
    return (a.dotted_order || '').localeCompare(b.dotted_order || '')
  })

  const maxDuration = Math.max(totalDurationMs, ...spans.map((s) => s.duration_ms), 1)

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] border-r border-slate-800/80 overflow-hidden">
      <div className="p-3.5 border-b border-slate-800 bg-[#11192e] flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Execution Waterfall ({spans.length} Spans)
        </h2>
        <div className="text-xs text-slate-400 font-mono">
          Total Duration: <span className="text-cyan-300">{(totalDurationMs / 1000).toFixed(2)}s</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedSpans.map((span) => {
          const depth = (span.dotted_order.split('.').length - 1) * 20
          const isSelected = span.span_id === selectedSpanId
          const durationRatio = Math.max((span.duration_ms / maxDuration) * 100, 2)
          const hasFallback =
            span.status === 'FALLBACK_TRIGGERED' ||
            (span.attempts && span.attempts.length > 1)

          return (
            <div
              key={span.span_id}
              onClick={() => onSelectSpan(span.span_id)}
              style={{ marginLeft: `${depth}px` }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                    {span.dotted_order}
                  </span>
                  {getSpanIcon(span.span_type)}
                  <span className="font-mono text-xs font-medium text-slate-200 truncate">
                    {span.name}
                  </span>
                  {getSpanTypeBadge(span.span_type)}
                  {hasFallback && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Fallback Triggered
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs text-slate-400 ml-2 shrink-0">
                  {span.duration_ms.toFixed(1)} ms
                </span>
              </div>

              {/* Relative Latency Bar */}
              <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    span.status === 'FAILED'
                      ? 'bg-rose-500'
                      : hasFallback
                      ? 'bg-amber-400'
                      : span.span_type === 'llm'
                      ? 'bg-purple-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${durationRatio}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
