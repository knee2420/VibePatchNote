import type { ReactNode } from 'react';

/** 고속 탭 항목 */
export interface QuickTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
}

/** 고속 탭 전환기 Props */
export interface QuickTabSwitcherProps {
  tabs: QuickTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  showShortcutHints?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
