import { useEffect, useState } from 'react';

/**
 * Shift 키를 누르고 있는지 추적합니다.
 *
 * 창이 포커스를 잃으면 keyup 을 못 받으므로 blur 에서도 반드시 내려줍니다.
 * (그렇지 않으면 Shift 가 눌린 채로 남아 커서가 crosshair 로 굳습니다.)
 */
export function useShiftKey(enabled: boolean): boolean {
  const [isShiftDown, setIsShiftDown] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsShiftDown(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
    };
    const handleBlur = () => setIsShiftDown(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  return isShiftDown;
}
