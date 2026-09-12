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

/**
 * 코드 지점의 원본을 가져온다.
 *
 * `module` 은 백엔드가 `importlib` 으로 **정확히 한 파일**로 해석한다.
 * 예전에는 파일명을 넘기면 백엔드가 저장소 전체를 glob 했고(요청당 1.4초),
 * 크기 내림차순으로 골라서 venv 의 남의 파일을 돌려주기도 했다.
 */
export async function fetchSourceCode(
  locator: { module?: string; filePath?: string; symbol?: string },
): Promise<SourceCodeResponse> {
  const query = new URLSearchParams()
  if (locator.module) query.set('module', locator.module)
  if (locator.filePath) query.set('file_path', locator.filePath)
  if (locator.symbol) query.set('symbol', locator.symbol)

  const res = await fetch(`/api/v1/inspector/source?${query.toString()}`)
  if (!res.ok) {
    const what = locator.module ?? locator.filePath ?? '(대상 없음)'
    throw new Error(`Failed to fetch source for ${what}: ${res.statusText}`)
  }
  return res.json()
}

