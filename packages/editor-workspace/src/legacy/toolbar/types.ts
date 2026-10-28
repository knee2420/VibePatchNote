import type { ReactNode } from 'react';

/**
 * [Document Web Mode] 상단 탑 메뉴바 Props.
 * 일반 웹 문서 뷰어/에디터에 최적화된 심플한 3단 슬롯 레이아웃입니다.
 */
export interface DocumentTopBarProps {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
}

/** 하위 호환을 위한 타입 별칭 */
export type TopMenuBarProps = DocumentTopBarProps;

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
