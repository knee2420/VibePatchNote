import React, { useEffect, useState } from 'react'
import {
  Activity,
  Cpu,
  GitCompare,
  Radio,
  Sparkles,
} from 'lucide-react'
import { deleteRun, fetchRunDetail, fetchRuns } from './api'
import { CompareDock } from './components/CompareDock'
import { MatrixViewer } from './components/MatrixViewer'
import { RunCompareView } from './components/RunCompareView'
import { RunList } from './components/RunList'
import { RunTimeline } from './components/RunTimeline'
import { SpanDetail } from './components/SpanDetail'
import type { CompareItem, RunDetail, RunSummary, SpanRecord } from './types'

type NavTab = 'runs' | 'compare' | 'matrix'

export const App: React.FC = () => {
  const [navTab, setNavTab] = useState<NavTab>('runs')
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null)
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 1. Cross-Trace Run A / Run B 기본 ID
  const [compareRunAId, setCompareRunAId] = useState<string | null>(null)
  const [compareRunBId, setCompareRunBId] = useState<string | null>(null)

  // 2. Universal Any-Card Compare 모드 및 2개 슬롯 (A / B)
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false)
  const [compareSlotA, setCompareSlotA] = useState<CompareItem | null>(null)
  const [compareSlotB, setCompareSlotB] = useState<CompareItem | null>(null)

  const loadRuns = async (retries = 2) => {
    setLoading(true)
    try {
      const data = await fetchRuns()
      setRuns(data)
      if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].run_id)
      }
      // Compare용 기본 선택 (최신 2개 런이 있는 경우 자동 지정)
      if (data.length >= 2) {
        setCompareRunAId((prev) => prev ?? data[0].run_id)
        setCompareRunBId((prev) => prev ?? data[1].run_id)
      } else if (data.length === 1) {
        setCompareRunAId((prev) => prev ?? data[0].run_id)
        setCompareRunBId((prev) => prev ?? data[0].run_id)
      }
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => {
          void loadRuns(retries - 1)
        }, 1200)
        return
      }
      console.error('Failed to load runs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRun = async (runId: string) => {
    try {
      await deleteRun(runId)
      const remaining = runs.filter((r) => r.run_id !== runId)
      setRuns(remaining)
      if (selectedRunId === runId) {
        setSelectedRunId(remaining.length > 0 ? remaining[0].run_id : null)
      }
      if (compareRunAId === runId) {
        setCompareRunAId(remaining.length > 0 ? remaining[0].run_id : null)
      }
      if (compareRunBId === runId) {
        setCompareRunBId(remaining.length > 1 ? remaining[1].run_id : remaining[0]?.run_id || null)
      }
    } catch (err) {
      console.error('Failed to delete run:', err)
      alert('실행 기록 삭제에 실패했습니다.')
    }
  }

  // 카드 픽 핸들러 (임의의 카드를 슬롯 1 / 슬롯 2에 순서대로 등록)
  const handlePickCompareItem = (item: CompareItem) => {
    if (!compareSlotA) {
      setCompareSlotA(item)
    } else if (!compareSlotB) {
      if (compareSlotA.id === item.id) {
        // 동일 아이템 다시 클릭 시 슬롯 A 취소
        setCompareSlotA(null)
        return
      }
      setCompareSlotB(item)
      // 2개 아이템이 모두 선택되면 400ms 후 자동으로 모드 완료 및 Compare 탭으로 이동!
      setTimeout(() => {
        setIsCompareMode(false)
        setNavTab('compare')
      }, 400)
    } else {
      // 둘 다 채워져 있을 때 새로 누르면 슬롯 B 교체
      setCompareSlotB(item)
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
              onClick={() => setNavTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                navTab === 'compare'
                  ? 'bg-slate-800 text-cyan-300 ring-1 ring-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
              Run & Span Compare
              {(compareSlotA || compareSlotB) && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
              )}
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
          {/* Compare 모드 바로 켜기 토글 버튼 */}
          <button
            type="button"
            onClick={() => setIsCompareMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isCompareMode
                ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                : 'bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {isCompareMode ? 'Compare 모드 ON' : 'Compare 모드'}
          </button>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>API: 8000</span>
          </div>
        </div>
      </header>

      {/* Universal Compare Selection Dock (Compare 모드 활성화 시 네비게이션 바로 아래 슬라이드인) */}
      {isCompareMode && (
        <CompareDock
          slotA={compareSlotA}
          slotB={compareSlotB}
          onClearSlotA={() => setCompareSlotA(null)}
          onClearSlotB={() => setCompareSlotB(null)}
          onCloseCompareMode={() => setIsCompareMode(false)}
          onOpenDiff={() => {
            setIsCompareMode(false)
            setNavTab('compare')
          }}
        />
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {navTab === 'runs' && (
          <>
            <RunList
              runs={runs}
              selectedRunId={selectedRunId}
              onSelectRun={(id) => setSelectedRunId(id)}
              onRefresh={loadRuns}
              onDeleteRun={handleDeleteRun}
              loading={loading}
              isCompareMode={isCompareMode}
              onToggleCompareMode={() => setIsCompareMode((prev) => !prev)}
              compareSlotAId={compareSlotA?.id || null}
              compareSlotBId={compareSlotB?.id || null}
              onPickCompareItem={handlePickCompareItem}
            />

            {runDetail ? (
              <>
                <RunTimeline
                  spans={runDetail.spans}
                  selectedSpanId={selectedSpanId}
                  onSelectSpan={(id) => setSelectedSpanId(id)}
                  totalDurationMs={runDetail.meta.duration_ms || 0}
                  isCompareMode={isCompareMode}
                  compareSlotAId={compareSlotA?.id || null}
                  compareSlotBId={compareSlotB?.id || null}
                  onPickCompareItem={handlePickCompareItem}
                />
                <SpanDetail
                  span={selectedSpan}
                  snapshots={runDetail.snapshots || {}}
                  isCompareMode={isCompareMode}
                  compareSlotAId={compareSlotA?.id || null}
                  compareSlotBId={compareSlotB?.id || null}
                  onPickCompareItem={handlePickCompareItem}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                {loading ? 'Loading run details...' : 'Select a run from the left panel'}
              </div>
            )}
          </>
        )}

        {navTab === 'compare' && (
          <RunCompareView
            runs={runs}
            initialRunAId={compareRunAId}
            initialRunBId={compareRunBId}
            onSelectRunA={setCompareRunAId}
            onSelectRunB={setCompareRunBId}
            customSlotA={compareSlotA}
            customSlotB={compareSlotB}
            onClearCustomSlots={() => {
              setCompareSlotA(null)
              setCompareSlotB(null)
            }}
          />
        )}

        {navTab === 'matrix' && <MatrixViewer />}
      </main>
    </div>
  )
}
export default App
