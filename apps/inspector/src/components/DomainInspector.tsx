import React, { useState } from 'react'
import { Eye, FileCode, Layers, Search } from 'lucide-react'
import type { RunDetail } from '../types'

interface DomainInspectorProps {
  runDetail: RunDetail | null
}

export const DomainInspector: React.FC<DomainInspectorProps> = ({ runDetail }) => {
  const [searchTerm, setSearchTerm] = useState('')

  if (!runDetail) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-[#0b0f19] text-slate-500 text-xs p-8">
        Select a run from the Runs tab to inspect domain extraction, bounding boxes, and reconstructed text.
      </div>
    )
  }

  const { snapshots, meta } = runDetail
  const contextSnapshot = snapshots['context_build'] || snapshots['context_builder']
  const parsedSnapshot = snapshots['structured_parsing'] || snapshots['outline_schema_validation']

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Domain Extraction & Vision Inspector
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconstructed layout, OCR text chunks, and structured schema verification for run{' '}
            <code className="text-cyan-300 font-mono">{meta.run_id}</code>.
          </p>
        </div>

        {/* Snapshot Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage 1: Context Reconstruct */}
          <div className="flex flex-col rounded-lg border border-slate-800 bg-[#0d1322] overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 bg-[#11192e] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Stage 1: Context Builder Markdown
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {contextSnapshot ? `${JSON.stringify(contextSnapshot).length} bytes` : 'N/A'}
              </span>
            </div>

            <div className="p-4 flex-1">
              {contextSnapshot ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#070b14] border border-slate-800 text-xs">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter text lines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full text-xs font-mono"
                    />
                  </div>
                  <pre className="p-3 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[11px] font-mono max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {typeof contextSnapshot === 'string'
                      ? contextSnapshot
                          .split('\n')
                          .filter((l) => !searchTerm || l.toLowerCase().includes(searchTerm.toLowerCase()))
                          .join('\n')
                      : JSON.stringify(contextSnapshot, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs py-12">
                  No context snapshot was captured for this run.
                </div>
              )}
            </div>
          </div>

          {/* Stage 2: Structured Output Elements */}
          <div className="flex flex-col rounded-lg border border-slate-800 bg-[#0d1322] overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 bg-[#11192e] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Stage 4: Structured Schema Parsing
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {parsedSnapshot ? 'Validated' : 'N/A'}
              </span>
            </div>

            <div className="p-4 flex-1">
              {parsedSnapshot ? (
                <pre className="p-3 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-[11px] font-mono max-h-[540px] overflow-y-auto leading-relaxed">
                  {JSON.stringify(parsedSnapshot, null, 2)}
                </pre>
              ) : (
                <div className="text-center text-slate-500 text-xs py-12">
                  No structured parsing snapshot was captured for this run.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
