/**
 * @fileoverview Inspector 타입 배럴.
 *
 * 백엔드 계약에서 오는 타입은 전부 `generated.ts` 에서 나온다 — 손으로 베끼지 않는다.
 * 이 파일에는 **화면에만 존재하는 개념**만 둔다.
 *
 * 정본: `.agents/rules/60-data/observability.md`
 */

export * from './generated'

import type { InspectorSpanView, SpanStatus } from './generated'

/** 워터폴에서 다루는 스팬. 백엔드 조인 결과와 같다. */
export type SpanRecordView = InspectorSpanView

/**
 * Compare 슬롯에 담기는 임의의 카드.
 * 백엔드에 대응물이 없는 순수 UI 개념이므로 생성 대상이 아니다.
 */
export interface CompareItem {
  readonly id: string
  readonly type: 'run' | 'span' | 'inputs' | 'outputs' | 'code' | 'json' | 'workflow'
  readonly title: string
  readonly subtitle?: string
  readonly content: string
  readonly language: string
  readonly runId?: string
  readonly spanId?: string
}

/**
 * 상태를 화면 의미로 좁힌다.
 *
 * 저장된 상태는 소문자다(`observability.md` §3-1). 예전 프론트는 `'SUCCESS'` 와
 * 비교하다가 **성공한 스팬을 전부 실패 색으로 렌더**했다. 비교는 이 함수로만 한다.
 */
export type StatusTone = 'ok' | 'fail' | 'busy' | 'idle'

export function statusTone(status: SpanStatus | string | null | undefined): StatusTone {
  switch ((status ?? '').toLowerCase()) {
    case 'success':
    case 'completed':
      return 'ok'
    case 'failed':
    case 'error':
    case 'timeout':
      return 'fail'
    case 'running':
      return 'busy'
    default:
      // pending · skipped · queued · waiting_* — 실패가 아니라 아직/보류다.
      return 'idle'
  }
}

/**
 * 폴백이 일어났는가.
 *
 * 상태가 아니라 **시도가 2회 이상이라는 사실**이다. 예전 프론트는
 * `'FALLBACK_TRIGGERED'` 라는 백엔드에 없는 상태값과 비교하고 있었다.
 */
export function hasFallback(span: Pick<InspectorSpanView, 'attempts'>): boolean {
  return (span.attempts?.length ?? 0) > 1
}
