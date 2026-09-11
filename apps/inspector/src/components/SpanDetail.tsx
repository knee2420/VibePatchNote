import React, { useState } from 'react'
import {
  AlertCircle,
  Braces,
  CheckCircle2,
  Code2,
  Cpu,
  FileText,
  Terminal,
} from 'lucide-react'
import type { SpanRecord } from '../types'

interface SpanDetailProps {
  span: SpanRecord | null
  snapshots: Record<string, any>
}

type TabType = 'io' | 'attempts' | 'snapshots' | 'raw'

export const SpanDetail: React.FC<SpanDetailProps> = ({ span, snapshots }) => {
  const [activeTab, setActiveTab] = useState<TabType>('io')

  if (!span) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-[#0d1322] text-slate-500 text-xs p-8">
        Select a span from the waterfall timeline to view inputs, outputs, snapshots, and fallback attempts.
      </div>
    )
  }

  const attempts = span.attempts || []
  const hasAttempts = attempts.length > 0
  const matchingSnapshotKeys = Object.keys(snapshots).filter((k) =>
    span.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(span.name.toLowerCase())
  )

  return (
    <div className="w-96 lg:w-[480px] shrink-0 flex flex-col h-full bg-[#0d1322]">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#11192e]">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
            {span.name}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              span.status === 'SUCCESS'
                ? 'bg-emerald-500/10 text-emerald-400'
                : span.status === 'FALLBACK_TRIGGERED'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {span.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span>Type: <span className="text-cyan-400">{span.span_type}</span></span>
          <span>Latency: <span className="text-cyan-400">{span.duration_ms.toFixed(1)}ms</span></span>
          <span>Order: <span className="text-slate-300">#{span.dotted_order}</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-2 text-xs">
        <button
          onClick={() => setActiveTab('io')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'io'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Braces className="w-3.5 h-3.5" />
          Inputs & Outputs
        </button>

        {hasAttempts && (
          <button
            onClick={() => setActiveTab('attempts')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'attempts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Attempts ({attempts.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'snapshots'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Snapshots ({Object.keys(snapshots).length})
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'raw'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Raw JSON
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {activeTab === 'io' && (
          <>
            {span.error && (
              <div className="p-3 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  Error: {span.error.code}
                </div>
                <div className="text-[11px] break-words">{span.error.message}</div>
                {span.error.traceback && (
                  <pre className="text-[10px] mt-2 p-2 bg-black/40 rounded overflow-x-auto text-rose-200/80">
                    {span.error.traceback}
                  </pre>
                )}
              </div>
            )}

            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                Inputs:
              </div>
              <pre className="p-2.5 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[11px] overflow-x-auto">
                {JSON.stringify(span.inputs || {}, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                Outputs:
              </div>
              <pre className="p-2.5 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[11px] overflow-x-auto">
                {JSON.stringify(span.outputs || {}, null, 2)}
              </pre>
            </div>
          </>
        )}

        {activeTab === 'attempts' && (
          <div className="space-y-3">
            {attempts.map((att) => (
              <div
                key={att.attempt_index}
                className="p-3 rounded border border-slate-800 bg-[#090d18] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Attempt #{att.attempt_index + 1}: {att.provider}
                  </span>
                  {att.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      SUCCESS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-2">
                  <div>Model: <span className="text-slate-200">{att.model}</span></div>
                  <div>Latency: <span className="text-cyan-400">{att.duration_ms.toFixed(1)}ms</span></div>
                  <div>Tokens: <span className="text-slate-200">{att.input_tokens + att.output_tokens}</span></div>
                  <div>Cost: <span className="text-emerald-400">${att.cost_usd.toFixed(4)}</span></div>
                </div>

                {att.failure_reason && (
                  <div className="text-[11px] text-rose-400">
                    Reason: {att.failure_reason}
                  </div>
                )}

                {att.raw_command && (
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> Raw Command
                    </div>
                    <pre className="text-[10px] p-2 bg-black/50 border border-slate-800 rounded text-slate-300 overflow-x-auto">
                      {att.raw_command}
                    </pre>
                  </div>
                )}

                {att.stderr_sample && (
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> Stderr Output
                    </div>
                    <pre className="text-[10px] p-2 bg-rose-950/20 border border-rose-900/40 rounded text-rose-300/90 overflow-x-auto">
                      {att.stderr_sample}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'snapshots' && (
          <div className="space-y-4">
            {Object.entries(snapshots).map(([key, data]) => {
              const isRelevant = matchingSnapshotKeys.includes(key)
              return (
                <div
                  key={key}
                  className={`p-3 rounded border ${
                    isRelevant ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-slate-800 bg-[#090d18]'
                  }`}
                >
                  <div className="text-xs font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Snapshot: {key}
                  </div>
                  <pre className="p-2.5 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[10px] max-h-60 overflow-y-auto">
                    {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'raw' && (
          <pre className="p-2.5 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[11px] overflow-x-auto">
            {JSON.stringify(span, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
