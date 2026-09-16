import type { ReactNode } from 'react';

/** 노드 인라인 액션 아이템 */
export interface NodeActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  disabled?: boolean;
}

/** 액션 바 Props */
export interface NodeActionBarProps {
  actions: NodeActionItem[];
  onTrigger: (actionId: string, event: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'xs';
}
