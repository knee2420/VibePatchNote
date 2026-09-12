import React, { useEffect, useState } from 'react'
import {
  Activity,
  Boxes,
  Cpu,
  GitCompare,
  Sparkles,
} from 'lucide-react'
import { deleteRun, fetchRunDetail, fetchRuns } from './api'
import { CompareDock } from './components/CompareDock'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MatrixViewer } from './components/MatrixViewer'
import { RunCompareView } from './components/RunCompareView'
import { RunList } from './components/RunList'
import { RunTimeline } from './components/RunTimeline'
import { SpanDetail } from './components/SpanDetail'
import { WorkflowCatalog } from './components/WorkflowCatalog'
import type { CompareItem, RunDetail, RunSummary, SpanRecordView } from './types'
import { numberOf } from './lib/payload'

type NavTab = 'runs' | 'compare' | 'workflows' | 'matrix'

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

  /** 배경 갱신. 로딩 표시를 건드리지 않는다. */
  const refreshRunsQuietly = async () => {
    try {
      setRuns(await fetchRuns())
    } catch {
      // 한 번 실패해도 다음 주기에 다시 시도한다. 화면을 흔들지 않는다.
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

  // 카드 픽 핸들러 (임의의 카드를 슬롯 1 / 슬롯 2에 등록, workflow 타입 강제)
  const handlePickCompareItem = (item: CompareItem) => {
    // 1. 만약 새로 선택한 아이템이 'workflow'(전체 워크플로우)인 경우:
    if (item.type === 'workflow') {
      if (!compareSlotA || compareSlotA.type !== 'workflow') {
        // 슬롯 A가 비어있거나 기존 슬롯 A가 일반 카드인 경우: 워크플로우 전용 슬롯으로 세팅
        setCompareSlotA(item)
        setCompareSlotB(null)
        return
      }

      if (compareSlotA.id === item.id) {
        // 동일한 런의 워크플로우 다시 클릭 시 슬롯 A 취소
        setCompareSlotA(null)
        return
      }

      // 슬롯 A에 이미 다른 런의 워크플로우가 있는 경우: 슬롯 B에 등록하고 400ms 후 Compare 탭으로 이동!
      setCompareSlotB(item)
      setTimeout(() => {
        setIsCompareMode(false)
        setNavTab('compare')
      }, 400)
      return
    }

    // 2. 만약 새로 선택한 아이템이 일반 카드인데, 슬롯 A에 'workflow'가 이미 담겨 있는 경우:
    if (compareSlotA?.type === 'workflow') {
      // 형을 강제하므로 일반 카드와 워크플로우는 혼용 불가 -> 새 일반 카드 비교로 전환
      setCompareSlotA(item)
      setCompareSlotB(null)
      return
    }

    // 3. 일반 카드 간의 1:1 대조 (코드 vs 코드, 프롬프트 vs 프롬프트 등)
    if (!compareSlotA) {
      setCompareSlotA(item)
    } else if (!compareSlotB) {
      if (compareSlotA.id === item.id) {
        setCompareSlotA(null)
        return
      }
      setCompareSlotB(item)
      setTimeout(() => {
        setIsCompareMode(false)
        setNavTab('compare')
      }, 400)
    } else {
      setCompareSlotB(item)
    }
  }

  useEffect(() => {
    loadRuns()
  }, [])

  // 진행 중인 run 이 있을 때만 목록을 다시 읽는다.
  //
  // 예전에는 자동 갱신이 아예 없어서, 분석을 돌려 놓고도 새로고침 버튼을
  // 누르기 전에는 아무 변화가 보이지 않았다. 반대로 무조건 폴링하면 아무 일도
  // 없는 화면에서 계속 디스크를 읽는다.
  //
  // `waiting_*` 은 **사람의 결정을 기다리는 보류**다(60-data §4-6). 몇 시간이
  // 걸릴 수 있으므로 폴링 대상이 아니다 — 사람이 조작하면 그때 갱신된다.
  const hasRunningRun = runs.some(
    (run) => run.status === 'running' || run.status === 'queued'
  )

  useEffect(() => {
    if (!hasRunningRun) return
    const timer = window.setInterval(() => {
      // 배경 갱신이다. 재시도도 로딩 표시도 하지 않는다 — 3초마다 새로고침
      // 아이콘이 도는 화면은 "무언가 잘못됐다"처럼 보인다.
      void refreshRunsQuietly()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [hasRunningRun])

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

  const selectedSpan: SpanRecordView | null =
    runDetail?.spans.find((s) => s.span_id === selectedSpanId) || null

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden font-sans">
      {/* Top Navbar (GitHub Dark Inset Header) */}
      <header className="h-12 bg-[#010409] border-b border-[#30363d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#e6edf3] shadow-sm">
              <Sparkles className="w-4 h-4 text-[#58a6ff]" />
            </div>
            <span className="font-bold text-sm tracking-wide text-[#e6edf3]">
              VIBE <span className="text-[#848d97] font-mono text-xs font-normal">INSPECTOR</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#848d97] border border-[#30363d] ml-1">
              :5174
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setNavTab('runs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                navTab === 'runs'
                  ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Runs & Waterfall
            </button>

            <button
              onClick={() => setNavTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                navTab === 'compare'
                  ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-[#58a6ff]" />
              Run & Span Compare
              {(compareSlotA || compareSlotB) && (
                <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setNavTab('workflows')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                navTab === 'workflows'
                  ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Workflow Catalog
            </button>

            <button
              onClick={() => setNavTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                navTab === 'matrix'
                  ? 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#848d97] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Engine Matrix
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Compare 모드 바로 켜기 토글 버튼 (GitHub Button 룩앤필) */}
          <button
            type="button"
            onClick={() => setIsCompareMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              isCompareMode
                ? 'bg-[#1f6feb] text-white border border-[#388bfd]/50 shadow-sm font-semibold'
                : 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d] hover:bg-[#30363d] hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {isCompareMode ? 'Compare 모드 ON' : 'Compare 모드'}
          </button>

          <div className="flex items-center gap-1.5 text-[#848d97] font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
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
                <ErrorBoundary label="실행 워터폴">
                <RunTimeline
                  runId={selectedRunId || undefined}
                  runLabel={runs.find((r) => r.run_id === selectedRunId)?.workflow_label || runs.find((r) => r.run_id === selectedRunId)?.task_name || undefined}
                  primaryModel={runs.find((r) => r.run_id === selectedRunId)?.primary_model || undefined}
                  spans={runDetail.spans}
                  snapshots={runDetail.snapshots}
                  selectedSpanId={selectedSpanId}
                  onSelectSpan={(id) => setSelectedSpanId(id)}
                  totalDurationMs={numberOf(runDetail.meta, 'total_latency_ms', 'duration_ms') ?? 0}
                  isCompareMode={isCompareMode}
                  compareSlotAId={compareSlotA?.id || null}
                  compareSlotBId={compareSlotB?.id || null}
                  onPickCompareItem={handlePickCompareItem}
                />
                </ErrorBoundary>
                <ErrorBoundary label="스팬 상세">
                <SpanDetail
                  span={selectedSpan}
                  runId={selectedRunId}
                  isCompareMode={isCompareMode}
                  compareSlotAId={compareSlotA?.id || null}
                  compareSlotBId={compareSlotB?.id || null}
                  onPickCompareItem={handlePickCompareItem}
                />
                </ErrorBoundary>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#848d97] text-xs">
                {loading ? 'Loading run details...' : 'Select a run from the left panel'}
              </div>
            )}
          </>
        )}

        {navTab === 'compare' && (
          <ErrorBoundary label="1:1 대조">
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
            onSwapCustomSlots={() => {
              const tmp = compareSlotA
              setCompareSlotA(compareSlotB)
              setCompareSlotB(tmp)
            }}
          />
          </ErrorBoundary>
        )}

        {navTab === 'workflows' && (
          <ErrorBoundary label="워크플로우 카탈로그">
            <WorkflowCatalog />
          </ErrorBoundary>
        )}

        {navTab === 'matrix' && (
          <ErrorBoundary label="엔진 매트릭스">
            <MatrixViewer />
          </ErrorBoundary>
        )}
      </main>
    </div>
  )
}
export default App
