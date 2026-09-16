/** AI ↔ 원본 뷰어 점프 이벤트 페이로드 */
export interface AiViewerJumpPayload {
  docId?: string;
  sourceDocTitle?: string;
  page?: number;
  box_2d?: [number, number, number, number];
  slotId?: string;
  reason?: string;
}

/** AI 작업 전 사전 스냅샷 옵션 */
export interface PreAiSnapshotOptions<T = Record<string, unknown>> {
  label?: string;
  description?: string;
  content: string;
  extra?: T;
}

/** 사전 스냅샷 제어 훅 반환값 */
export interface UsePreAiSnapshotReturn<T = Record<string, unknown>> {
  captureSnapshotBeforeAi: (options: PreAiSnapshotOptions<T>) => string;
  rollbackLastAiAction: () => boolean;
  historyCount: number;
}
