import type { ReactNode } from 'react';

/** 고정 셸 패널(사이드바/인스펙터) Props */
export interface WorkspacePanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  bodyClassName?: string;
}

/** 패널 내부 가로 툴바 Props */
export interface PanelToolbarProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
}
