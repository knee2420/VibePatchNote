import React, { useEffect, useState } from 'react'
import { Check, Cpu, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import { fetchMatrix } from '../api'
import type { MatrixResponse } from '../types'

export const MatrixViewer: React.FC = () => {
  const [matrix, setMatrix] = useState<MatrixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMatrix = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMatrix()
      setMatrix(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load model registry matrix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatrix()
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Engine & Model Registry (SSOT)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registered models, execution harnesses, and fallback routing matrix defined in <code className="text-cyan-300">scaffold-engine</code>.
            </p>
          </div>
          <button
            onClick={loadMatrix}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Matrix
          </button>
        </div>

        {error && (
          <div className="p-4 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {error}
          </div>
        )}

        {matrix && (
          <>
            {/* Routing Policy Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Primary Routing Provider
                </span>
                <div className="text-base font-mono font-bold text-slate-100">
                  {matrix.primary_provider}
                </div>
                <div className="text-xs text-slate-400">
                  Default execution path for all pipeline requests.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-950/10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Fallback Provider (Fail-safe)
                </span>
                <div className="text-base font-mono font-bold text-slate-100">
                  {matrix.fallback_provider}
                </div>
                <div className="text-xs text-slate-400">
                  Automatically triggered upon 429 quota exhaustion or CLI bridge failures.
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] overflow-hidden">
              <div className="p-3.5 border-b border-slate-800 bg-[#11192e] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Available Model Registry ({matrix.models.length})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Model Name</th>
                      <th className="p-3">Family</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Context Window</th>
                      <th className="p-3">Max Output</th>
                      <th className="p-3">Structured Schema</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {matrix.models.map((model) => (
                      <tr key={model.name} className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-cyan-300">
                          {model.name}
                          {model.display_name && (
                            <span className="ml-2 font-normal text-slate-400 text-[11px]">
                              ({model.display_name})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {model.family}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{model.provider}</td>
                        <td className="p-3 text-slate-300">
                          {model.max_input_tokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3 text-slate-300">
                          {model.max_output_tokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3">
                          {model.supports_structured_schema ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Supported
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
