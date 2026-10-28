import type { AiViewerJumpPayload } from './types';

const AI_VIEWER_JUMP_EVENT = 'vibe:ai-viewer-jump';

/**
 * WorkspaceAiBridge (AI ↔ 원본 뷰어 뷰포트 동기화 브릿지)
 *
 * AI 생성 문장의 인용 클릭 시, 원본 PDF 뷰어의 해당 페이지와 바운딩 박스(box_2d)로
 * 자동 스크롤/포커싱하도록 표준 브라우저 이벤트를 발행 및 수신합니다.
 */
export const WorkspaceAiBridge = {
  /** AI 인용 ➔ 원본 뷰어로 점프 명령 발행 */
  emitJumpToSource(payload: AiViewerJumpPayload): void {
    if (typeof window === 'undefined') return;
    const event = new CustomEvent<AiViewerJumpPayload>(AI_VIEWER_JUMP_EVENT, {
      detail: payload,
    });
    window.dispatchEvent(event);
  },

  /** 원본 뷰어에서 AI 점프 명령 수신 리스너 등록 */
  subscribeToJump(listener: (payload: AiViewerJumpPayload) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AiViewerJumpPayload>;
      if (customEvent.detail) {
        listener(customEvent.detail);
      }
    };

    window.addEventListener(AI_VIEWER_JUMP_EVENT, handler);
    return () => {
      window.removeEventListener(AI_VIEWER_JUMP_EVENT, handler);
    };
  },
};
