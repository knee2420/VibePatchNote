/**
 * @file text.ts
 * @description 텍스트 캐럿 분할 및 병합 변형 (Transform)
 */

/** Enter 키 입력 시 캐럿 위치 기준 텍스트 분할 */
export function splitTextAtCaret(
  text: string,
  caretPos: number
): { before: string; after: string } {
  const safePos = Math.max(0, Math.min(caretPos, text.length));
  return {
    before: text.slice(0, safePos),
    after: text.slice(safePos),
  };
}

/** Backspace 맨 앞(caret=0)에서 윗줄과 텍스트 병합 */
export function mergeTextAtCaret(
  prevText: string,
  currText: string
): { mergedText: string; caretOffset: number } {
  return {
    mergedText: prevText + currText,
    caretOffset: prevText.length,
  };
}
