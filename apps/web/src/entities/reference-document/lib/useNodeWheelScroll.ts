import { useCallback } from 'react';

interface UseNodeWheelScrollProps {
  selected: boolean;
  isSpread: boolean;
}

export function useNodeWheelScroll({ selected, isSpread }: UseNodeWheelScrollProps) {
  const handleNodeWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!selected) return;
      // 캔버스 줌/팬 이벤트로 버블링되는 것을 호스트 차원에서 차단
      e.stopPropagation();

      // 가로 모드(isSpread)일 때 상하 휠(deltaY)을 가로 스크롤로 변환
      if (isSpread) {
        const scrollEl = e.currentTarget.querySelector('.overflow-x-auto') as HTMLElement | null;
        if (scrollEl) {
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          scrollEl.scrollLeft += delta;
        }
      }
      // 세로 모드는 nowheel 클래스를 통해 브라우저 네이티브 overflow-y-auto 관성 스크롤이 매끄럽게 동작합니다.
    },
    [selected, isSpread]
  );

  return { handleNodeWheel };
}
