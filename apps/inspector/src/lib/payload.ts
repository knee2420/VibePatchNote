/**
 * @fileoverview `inputs` / `outputs` / `metadata.extra` 안전 접근.
 *
 * 계약상 이것들은 `Dict[str, Any]` 라 프론트에서는 `Record<string, unknown>` 이다.
 * 그 값을 `as string` 으로 단언하면 타입 검사만 통과하고 런타임에 깨진다 —
 * Attempts 탭 백화면이 정확히 그 패턴이었다.
 *
 * 그래서 **좁히되 단언하지 않는다.** 원하는 모양이 아니면 `null` 이다.
 *
 * 이 파일은 임시방편이다. 페이로드에 JSON Schema 를 동반시키면
 * (로드맵 A4-1) 스키마 기반 렌더로 대체된다.
 */

/** 문자열이면 그대로, 아니면 null. 빈 문자열도 null 로 본다. */
export function asText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** 유한한 수면 그대로, 아니면 null. */
export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** 객체면 그대로, 아니면 빈 객체. */
export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** 주어진 키를 순서대로 보고, 처음으로 문자열인 값을 돌려준다. */
export function textOf(
  source: Record<string, unknown> | null | undefined,
  ...keys: readonly string[]
): string | null {
  if (!source) return null
  for (const key of keys) {
    const found = asText(source[key])
    if (found !== null) return found
  }
  return null
}

/** 주어진 키를 순서대로 보고, 처음으로 수인 값을 돌려준다. */
export function numberOf(
  source: Record<string, unknown> | null | undefined,
  ...keys: readonly string[]
): number | null {
  if (!source) return null
  for (const key of keys) {
    const found = asNumber(source[key])
    if (found !== null) return found
  }
  return null
}

/**
 * 문자열 또는 문자열 배열을 하나의 명령어 문자열로 만든다.
 * `cli_command` 는 계약상 `List[str]` 이고 `raw_command` 는 문자열이다.
 */
export function commandOf(value: unknown): string | null {
  if (typeof value === 'string') return value.length > 0 ? value : null
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === 'string')
    return parts.length > 0 ? parts.join(' ') : null
  }
  return null
}

/**
 * 대용량 페이로드 포인터.
 *
 * 원장에는 본문 대신 이것이 실린다. 미리보기가 함께 오므로, 펼치지 않아도
 * 무엇인지는 알 수 있다.
 */
export interface PayloadRef {
  readonly __payload_ref__: string
  readonly bytes: number
  readonly preview: string
  readonly media_type: string
}

export function isPayloadRef(value: unknown): value is PayloadRef {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).__payload_ref__ === 'string'
  )
}

/** 포인터의 미디어 타입을 뷰어 언어로 옮긴다. */
export function refLanguage(ref: PayloadRef): 'json' | 'markdown' | 'text' {
  if (ref.media_type === 'application/json') return 'json'
  if (ref.media_type === 'text/markdown') return 'markdown'
  return 'text'
}
