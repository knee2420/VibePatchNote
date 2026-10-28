import { useEffect } from 'react';
import type { QuickTabItem } from './types';

/**
 * 키보드 단축키(Ctrl+1~9, Alt+ArrowLeft/Right)를 통해 패널 탭을 초고속으로 전환할 수 있는 훅.
 */
export function useKeyboardTabSwitch(
  tabs: QuickTabItem[],
  activeId: string,
  onChange: (id: string) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || tabs.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl + 숫자 (1 ~ 9) 로 탭 직접 점프
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault();
          const target = tabs[num - 1];
          if (target && !target.disabled) {
            onChange(target.id);
          }
          return;
        }
      }

      // 2. Alt + 좌/우 방향키로 이전/다음 탭 순환
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const currentIndex = tabs.findIndex((t) => t.id === activeId);
          const nextIndex = (currentIndex + 1) % tabs.length;
          onChange(tabs[nextIndex].id);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const currentIndex = tabs.findIndex((t) => t.id === activeId);
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          onChange(tabs[prevIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabs, activeId, onChange, enabled]);
}
