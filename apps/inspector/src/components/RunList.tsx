import React from 'react'
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type { RunSummary } from '../types'

interface RunListProps {
  runs: RunSummary[]
  selectedRunId: string | null
  onSelectRun: (runId: string) => void
  onRefresh: () => void
  onDeleteRun?: (runId: string) => Promise<void> | void
  loading: boolean
}

function formatDateTime(isoString: string): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return isoString
  }
}

function getProviderBadge(provider?: string | null) {
  if (!provider) return null
  const p = provider.toLowerCase()
  if (p.includes('cli') || p.includes('agy')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase font-semibold">
        CLI
      </span>
    )
  }
  if (p.includes('google') || p.includes('api') || p.includes('genai') || p.includes('gemini')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-semibold">
        GOOGLE API
      </span>
    )
  }
  if (p.includes('local') || p.includes('gemma')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
        LOCAL
      </span>
    )
  }
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase font-semibold">
      {provider.toUpperCase()}
    </span>
  )
}

function getDomainBadge(domain: string) {
  const normalized = (domain || 'documents').toLowerCase()
  if (normalized.includes('doc')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase font-semibold">
        DOCS
      </span>
    )
  }
  if (normalized.includes('scaffold')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase font-semibold">
        SCAFFOLD
      </span>
    )
  }
  if (normalized.includes('novel')) {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
        NOVEL
      </span>
    )
  }
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600 uppercase font-semibold">
      {domain.toUpperCase()}
    </span>
  )
}

function getDisplayLabel(run: RunSummary): string {
  const label = run.workflow_label?.trim()
  if (label && !/^[\s?]+$/.test(label)) {
    return label
  }
  const name = (run.workflow_name || run.task_name || '').toLowerCase()
  if (name.includes('outline')) return '문서 목차 추출'
  if (name.includes('scaffold')) return '와이어프레임 생성'
  if (name.includes('scan')) return '문서 레이아웃 스캔'
  return run.workflow_name || run.task_name || '파이프라인 실행'
}

function getTargetName(run: RunSummary): string {
  const target = run.target_name?.trim()
  if (target && !/^[\s?]+$/.test(target)) {
    return target
  }
  return run.doc_id || run.task_name || ''
}

export const RunList: React.FC<RunListProps> = ({
  runs,
  selectedRunId,
  onSelectRun,
  onRefresh,
  onDeleteRun,
  loading,
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, run: RunSummary) => {
    e.stopPropagation()
    if (!onDeleteRun) return
    const targetLabel = run.target_name || run.workflow_label || run.task_name || run.run_id
    if (!window.confirm(`'${targetLabel}' 실행 기록을 삭제하시겠습니까?`)) {
      return
    }
    setDeletingId(run.run_id)
    try {
      await onDeleteRun(run.run_id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-slate-800/80 w-84 lg:w-92 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#11192e]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Runs Ledger ({runs.length})
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Refresh runs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {loading ? 'Scanning ledger...' : 'No telemetry runs recorded yet.'}
          </div>
        ) : (
          runs.map((run) => {
            const isSelected = run.run_id === selectedRunId
            const isSuccess = run.status?.toUpperCase() === 'SUCCESS'
            const displayLabel = getDisplayLabel(run)
            const targetName = getTargetName(run)
            const isDeleting = deletingId === run.run_id

            return (
              <div
                key={run.run_id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRun(run.run_id)}
                className={`w-full text-left p-3.5 transition-colors border-l-2 cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-cyan-950/25 border-cyan-500 text-slate-100'
                    : 'border-transparent hover:bg-slate-800/30 text-slate-400'
                }`}
              >
                {/* 1열: 도메인 뱃지 + 환경(CLI/API) 뱃지 + 실행 날짜/시각 + 상태 & 휴지통 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getDomainBadge(run.domain)}
                    {getProviderBadge(run.primary_provider)}
                    {run.created_at && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                        {formatDateTime(run.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSuccess ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        FAIL
                      </span>
                    )}

                    {onDeleteRun && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, run)}
                        disabled={isDeleting}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all opacity-40 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                        title="이 실행 기록 삭제"
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 2열: [Workflow 명칭] + 작업 대상 엔티티 (문서/챕터 등) */}
                <div className="mb-1.5">
                  <div className="font-semibold text-xs text-slate-200 truncate flex items-center gap-1.5">
                    <span className="text-cyan-400 shrink-0">[{displayLabel}]</span>
                    <span className="truncate text-slate-100">{targetName || run.task_name}</span>
                  </div>
                </div>

                {/* 3열: 고유 Run ID & 시스템 워크플로우 식별자 */}
                <div className="font-mono text-[10px] text-slate-500 truncate mb-2.5">
                  {run.workflow_name && run.workflow_name !== run.task_name && (
                    <span className="text-slate-400 mr-1.5">{run.workflow_name}</span>
                  )}
                  ID: {run.run_id}
                </div>

                {/* 4열: 소요 시간(Latency) + 토큰량 + 모델 */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {(run.total_duration_ms / 1000).toFixed(2)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-slate-500" />
                    {run.total_tokens.toLocaleString()} tok
                  </span>
                  {run.primary_model && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono truncate max-w-[100px]">
                      {run.primary_model.replace('gemini-', '')}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
