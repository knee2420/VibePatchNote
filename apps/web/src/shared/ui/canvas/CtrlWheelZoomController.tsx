import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

const ZOOM_IN_FACTOR = 1.15;
const ZOOM_OUT_FACTOR = 0.87;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

/**
 * [Ctrl + 마우스 휠 최우선 뷰포트 줌 컨트롤러]
 *
 * 마우스가 문서 카드, 텍스트 에디터, PDF 뷰어 등 하위 컴포넌트(nowheel, stopPropagation) 위에 있어도
 * DOM 캡처링(capture: true) 단계에서 Ctrl/Cmd + 휠 이벤트를 최우선 가로채어 뷰포트 줌을 실행하고,
 * 브라우저 전체 창 줌(110%, 125% 등)을 원천 차단합니다.
 * Ctrl 키가 없을 때의 일반 휠은 기존 카드 내부 스크롤 및 캔버스 패닝에 온전히 전달됩니다.
 */
export function CtrlWheelZoomController() {
  const { zoomTo, getZoom } = useReactFlow();

  useEffect(() => {
    const rfElement = document.querySelector('.react-flow') as HTMLElement | null;
    if (!rfElement) return;

    const handleWheelCapture = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      // 1. 브라우저 전체 창 확대/축소 방지 및 이벤트 선점
      e.preventDefault();
      e.stopPropagation();

      // 2. React Flow 뷰포트 줌인/줌아웃 (deltaY < 0: 줌인)
      const zoomFactor = e.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
      const nextZoom = Math.min(Math.max(getZoom() * zoomFactor, MIN_ZOOM), MAX_ZOOM);
      zoomTo(nextZoom, { duration: 60 });
    };

    // capture: true 로 자식 노드의 nowheel/stopPropagation 보다 먼저 가로챕니다.
    rfElement.addEventListener('wheel', handleWheelCapture, { passive: false, capture: true });
    return () => {
      rfElement.removeEventListener('wheel', handleWheelCapture, { capture: true });
    };
  }, [getZoom, zoomTo]);

  return null;
}
