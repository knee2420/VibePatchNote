/**
 * HTML5 드래그의 성격 판정.
 *
 * 캔버스 안에는 카드가 있고 그 안에서도 드래그가 일어난다. 무엇을 끌든 파일로
 * 보면 전체 화면 드롭 오버레이가 떠서 내부 조작을 방해한다.
 */
export function isFileDrag(transfer: DataTransfer | null): boolean {
  if (!transfer) return false;
  return Array.from(transfer.types).includes('Files');
}
