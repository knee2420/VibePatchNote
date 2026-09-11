import type { MatrixResponse, RunDetail, RunSummary, SourceCodeResponse } from './types'

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

export async function deleteRun(runId: string): Promise<void> {
  const res = await fetch(`/api/v1/inspector/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Failed to delete run ${runId}: ${res.statusText}`)
}

export async function fetchSourceCode(filePath: string, symbol?: string): Promise<SourceCodeResponse> {
  const query = new URLSearchParams({ file_path: filePath })
  if (symbol) query.set('symbol', symbol)
  const res = await fetch(`/api/v1/inspector/source?${query.toString()}`)
  if (!res.ok) throw new Error(`Failed to fetch source for ${filePath}: ${res.statusText}`)
  return res.json()
}

