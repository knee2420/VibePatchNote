import type { MatrixResponse, RunDetail, RunSummary } from './types'

export async function fetchRuns(limit = 50): Promise<RunSummary[]> {
  const res = await fetch(`/api/v1/inspector/runs?limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch runs: ${res.statusText}`)
  return res.json()
}

export async function fetchRunDetail(runId: string): Promise<RunDetail> {
  const res = await fetch(`/api/v1/inspector/runs/${encodeURIComponent(runId)}`)
  if (!res.ok) throw new Error(`Failed to fetch run ${runId}: ${res.statusText}`)
  return res.json()
}

export async function fetchMatrix(): Promise<MatrixResponse> {
  const res = await fetch('/api/v1/inspector/matrix')
  if (!res.ok) throw new Error(`Failed to fetch matrix: ${res.statusText}`)
  return res.json()
}
