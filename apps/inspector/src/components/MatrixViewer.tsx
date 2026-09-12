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
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
          <div>
            <h1 className="text-lg font-semibold text-[#e6edf3] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#58a6ff]" />
              Engine & Model Registry (SSOT)
            </h1>
            <p className="text-xs text-[#848d97] mt-1">
              Registered models, execution harnesses, and fallback routing matrix defined in <code className="text-[#58a6ff]">scaffold-engine</code>.
            </p>
          </div>
          <button
            onClick={loadMatrix}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Matrix
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 text-[#f85149] text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#f85149]" />
            {error}
          </div>
        )}

        {matrix && (
          <>
            {/* Routing Policy Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md border border-[#30363d] bg-[#161b22] space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#58a6ff]">
                  Primary Routing Provider
                </span>
                <div className="text-base font-mono font-bold text-[#e6edf3]">
                  {matrix.primary_provider}
                </div>
                <div className="text-xs text-[#848d97]">
                  Default execution path for all pipeline requests.
                </div>
              </div>

              <div className="p-4 rounded-md border border-[#30363d] bg-[#161b22] space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d29922]">
                  Fallback Provider (Fail-safe)
                </span>
                <div className="text-base font-mono font-bold text-[#e6edf3]">
                  {matrix.fallback_provider}
                </div>
                <div className="text-xs text-[#848d97]">
                  Automatically triggered upon 429 quota exhaustion or CLI bridge failures.
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div className="rounded-md border border-[#30363d] bg-[#0d1117] overflow-hidden">
              <div className="p-3.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#e6edf3] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#58a6ff]" />
                  Available Model Registry ({matrix.models.length})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#161b22] text-[#848d97] uppercase text-[10px] tracking-wider border-b border-[#30363d]">
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
                  <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                    {matrix.models.map((model) => (
                      <tr key={model.name} className="hover:bg-[#161b22]/50 transition-colors">
                        <td className="p-3 font-semibold text-[#58a6ff]">
                          {model.name}
                          {model.display_name && (
                            <span className="ml-2 font-normal text-[#848d97] text-[11px]">
                              ({model.display_name})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-[11px]">
                            {model.family}
                          </span>
                        </td>
                        <td className="p-3 text-[#848d97]">{model.provider}</td>
                        <td className="p-3 text-[#e6edf3]">
                          {model.max_input_tokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3 text-[#e6edf3]">
                          {model.max_output_tokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3">
                          {model.supports_structured_schema ? (
                            <span className="inline-flex items-center gap-1 text-[#3fb950] text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Supported
                            </span>
                          ) : (
                            <span className="text-[#848d97] text-[11px]">No</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
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
