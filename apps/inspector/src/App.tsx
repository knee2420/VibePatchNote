import React, { useEffect, useState } from 'react'
import {
  Activity,
  Cpu,
  Eye,
  Radio,
  Sparkles,
} from 'lucide-react'
import { fetchRunDetail, fetchRuns } from './api'
import { DomainInspector } from './components/DomainInspector'
import { MatrixViewer } from './components/MatrixViewer'
import { RunList } from './components/RunList'
import { RunTimeline } from './components/RunTimeline'
import { SpanDetail } from './components/SpanDetail'
import type { RunDetail, RunSummary, SpanRecord } from './types'

type NavTab = 'runs' | 'domain' | 'matrix'

export const App: React.FC = () => {
  const [navTab, setNavTab] = useState<NavTab>('runs')
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null)
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadRuns = async () => {
    setLoading(true)
    try {
      const data = await fetchRuns()
      setRuns(data)
      if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].run_id)
      }
    } catch (err) {
      console.error('Failed to load runs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRuns()
  }, [])

  useEffect(() => {
    if (!selectedRunId) {
      setRunDetail(null)
      setSelectedSpanId(null)
      return
    }

    const loadDetail = async () => {
      try {
        const detail = await fetchRunDetail(selectedRunId)
        setRunDetail(detail)
        if (detail.spans.length > 0) {
          setSelectedSpanId(detail.spans[0].span_id)
        } else {
          setSelectedSpanId(null)
        }
      } catch (err) {
        console.error('Failed to load run detail:', err)
      }
    }

    loadDetail()
  }, [selectedRunId])

  const selectedSpan: SpanRecord | null =
    runDetail?.spans.find((s) => s.span_id === selectedSpanId) || null

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-12 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-cyan-950/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white">
              VIBE <span className="text-cyan-400 font-mono text-xs font-normal">INSPECTOR</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-1">
              :5174
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setNavTab('runs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                navTab === 'runs'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Runs & Waterfall
            </button>

            <button
              onClick={() => setNavTab('domain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                navTab === 'domain'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Domain Vision
            </button>

            <button
              onClick={() => setNavTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                navTab === 'matrix'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Engine Matrix
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>API: 8000 (Connected)</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {navTab === 'runs' && (
          <>
            <RunList
              runs={runs}
              selectedRunId={selectedRunId}
              onSelectRun={(id) => setSelectedRunId(id)}
              onRefresh={loadRuns}
              loading={loading}
            />

            {runDetail ? (
              <>
                <RunTimeline
                  spans={runDetail.spans}
                  selectedSpanId={selectedSpanId}
                  onSelectSpan={(id) => setSelectedSpanId(id)}
                  totalDurationMs={runDetail.meta.duration_ms || 0}
                />
                <SpanDetail
                  span={selectedSpan}
                  snapshots={runDetail.snapshots || {}}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                {loading ? 'Loading run details...' : 'Select a run from the left panel'}
              </div>
            )}
          </>
        )}

        {navTab === 'domain' && <DomainInspector runDetail={runDetail} />}

        {navTab === 'matrix' && <MatrixViewer />}
      </main>
    </div>
  )
}
export default App
