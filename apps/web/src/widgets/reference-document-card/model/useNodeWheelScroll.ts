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

      // 자식 뷰어의 스크롤 컨테이너 탐색
      const scrollEl = e.currentTarget.querySelector('.overflow-y-auto, .overflow-x-auto') as HTMLElement | null;
      if (scrollEl) {
        if (isSpread) {
          // 가로 모드: 상하 휠(deltaY) 또는 좌우 휠(deltaX)을 가로 스크롤로 변환
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          scrollEl.scrollLeft += delta;
        } else {
          // 세로 모드: 위아래 스크롤
          scrollEl.scrollTop += e.deltaY;
        }
      }
    },
    [selected, isSpread]
  );

  return { handleNodeWheel };
}
