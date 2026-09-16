import type { ReactNode } from 'react';

/** 상단 탑 메뉴바 & 글로벌 툴바 Props */
export interface TopMenuBarProps {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
}

/** 뷰 모드 스위처 옵션 항목 */
export interface ViewModeOption<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

/** 뷰 모드 스위처 Props */
export interface ViewModeSwitchProps<T extends string = string> {
  options: ViewModeOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

/** 실시간 동기화 상태 타입 */
export type SyncStatusType = 'idle' | 'saving' | 'saved' | 'error';

/** 동기화 상태 배지 Props */
export interface SyncStatusBadgeProps {
  status: SyncStatusType;
  labels?: Partial<Record<SyncStatusType, string>>;
  className?: string;
}
