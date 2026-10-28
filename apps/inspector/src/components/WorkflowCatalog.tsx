/**
 * @fileoverview 워크플로우 카탈로그.
 *
 * "이 시스템에 어떤 워크플로우가 있고, 각각 어떤 단계로 이뤄지는가"에 답한다.
 * REQ-06 의 FR-01(단계별 계약)·FR-05(워크플로우 카탈로그)가 요구사항 정본이다.
 *
 * 이 화면은 **손으로 쓴 목록이 아니라 기록된 실행에서 도출**된다. 매니페스트를
 * 따로 관리하면 파이프라인이 바뀌어도 목록은 안 바뀌고, 어긋나도 아무도 모른다 —
 * 이 저장소가 방금 없앤 하드코딩이 다른 형태로 돌아오는 셈이다.
 */

import React, { useEffect, useState } from 'react'
import { AlertCircle, Boxes, Clock, Cpu, RefreshCw, Workflow } from 'lucide-react'

import { fetchWorkflows } from '../api'
import type { SpanSource, WorkflowInfo, WorkflowStageInfo } from '../types'
import { statusTone } from '../types'

const PHASE_LABEL: Record<string, string> = {
  pre_llm: '인입·준비',
  llm: 'AI 추론',
  post_llm: '검증·정산',
}

const TYPE_STYLE: Record<string, string> = {
  pipeline: 'text-[#a5b4fc]',
  chain: 'text-[#58a6ff]',
  llm: 'text-[#bc8cff]',
  tool: 'text-[#d29922]',
  parser: 'text-[#3fb950]',
}

function sourceLabel(source: SpanSource): string {
  if (source.label) return source.label
  const tail = source.module.split('.').pop() || source.module
  return source.qualname ? `${tail}.${source.qualname}` : tail
}

const StageRow: React.FC<{ stage: WorkflowStageInfo }> = ({ stage }) => (
  <div className="flex items-start gap-3 px-3 py-2 border-t border-[#30363d] first:border-t-0">
    <div className="w-24 shrink-0 pt-0.5">
      <span className={`text-[10px] font-mono uppercase ${TYPE_STYLE[stage.span_type] ?? 'text-[#848d97]'}`}>
        {stage.span_type}
      </span>
      {stage.phase && (
        <div className="text-[9px] text-[#848d97] mt-0.5">{PHASE_LABEL[stage.phase] ?? stage.phase}</div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-[#e6edf3] truncate">
        {stage.display_label || stage.name}
      </div>
      {stage.display_label && (
        <div className="text-[10px] font-mono text-[#848d97] truncate">{stage.name}</div>
      )}
      {stage.description && (
        <div className="text-[11px] text-[#848d97] mt-1 leading-relaxed">{stage.description}</div>
      )}
      {stage.sources.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {stage.sources.map((source, index) => (
            <span
              key={`${source.module}-${source.qualname}-${index}`}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#848d97]"
              title={source.module ? `${source.module}.${source.qualname}` : source.qualname}
            >
              {sourceLabel(source)}
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="text-right shrink-0 w-28">
      <div className="text-xs font-mono text-[#d29922]">
        {stage.median_duration_ms >= 1000
          ? `${(stage.median_duration_ms / 1000).toFixed(2)}s`
          : `${stage.median_duration_ms.toFixed(1)}ms`}
      </div>
      <div className="text-[10px] text-[#848d97]">중앙값 · {stage.seen_in_runs}회</div>
    </div>
  </div>
)

const WorkflowCard: React.FC<{ workflow: WorkflowInfo }> = ({ workflow }) => {
  const failed = Object.entries(workflow.status_counts)
    .filter(([status]) => statusTone(status) === 'fail')
    .reduce((acc, [, count]) => acc + count, 0)

  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#58a6ff] shrink-0" />
              <span className="text-sm font-semibold text-[#e6edf3] truncate">
                {workflow.workflow_label || workflow.workflow_name}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#848d97] mt-0.5 truncate">
              {workflow.workflow_name}
              {workflow.pipeline_name && ` · ${workflow.pipeline_name}`}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
            <span className="text-[#848d97]">
              실행 <span className="text-[#e6edf3] font-semibold">{workflow.run_count}</span>건
            </span>
            {failed > 0 && (
              <span className="flex items-center gap-1 text-[#f85149]">
                <AlertCircle className="w-3 h-3" />
                실패 {failed}
              </span>
            )}
            {workflow.last_run_at && (
              <span className="flex items-center gap-1 text-[#848d97]">
                <Clock className="w-3 h-3" />
                {workflow.last_run_at.slice(0, 16).replace('T', ' ')}
              </span>
            )}
          </div>
        </div>

        {workflow.models.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Cpu className="w-3 h-3 text-[#848d97]" />
            {workflow.models.map((model) => (
              <span
                key={model}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#bc8cff]"
              >
                {model}
              </span>
            ))}
          </div>
        )}
      </div>

      {workflow.stages.length === 0 ? (
        <div className="px-4 py-3 text-[11px] text-[#848d97] italic">
          이 워크플로우는 아직 단계가 계측되지 않았습니다. 목록과 비용은 온전합니다.
        </div>
      ) : (
        <div>
          {workflow.stages.map((stage) => (
            <StageRow key={stage.name} stage={stage} />
          ))}
        </div>
      )}
    </div>
  )
}

export const WorkflowCatalog: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setWorkflows(await fetchWorkflows())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        <div className="flex items-start justify-between border-b border-[#30363d] pb-4 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[#e6edf3] flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#58a6ff]" />
              Workflow Catalog
            </h1>
            <p className="text-xs text-[#848d97] mt-1 leading-relaxed">
              기록된 실행에서 <strong className="text-[#c9d1d9]">도출된</strong> 목록입니다.
              손으로 관리하는 매니페스트가 아니므로, 파이프라인이 바뀌면 여기도 따라 바뀝니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-[#21262d] text-[#848d97] hover:text-[#e6edf3] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            title="다시 불러오기"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#58a6ff]' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-md border border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.1)] text-xs text-[#f85149]">
            워크플로우를 불러오지 못했습니다: {error}
          </div>
        )}

        {!error && workflows.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-[#848d97]">
            아직 실행된 워크플로우가 없습니다.
          </div>
        )}

        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.workflow_name} workflow={workflow} />
        ))}
      </div>
    </div>
  )
}
