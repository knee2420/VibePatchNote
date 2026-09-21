// ============================================================================
// 1. [IDE Mode] 데스크톱 IDE 스타일 고밀도 윈도우 헤더 및 5대 Primitives
// ============================================================================
export {
  IdeWindowHeader,
  IdeBrandLogo,
  IdeMenuBar,
  IdeTitleHeader,
  IdePanelToggleGroup,
  WindowControlButtons,
} from './ide';

export type {
  IdeBrandLogoProps,
  IdeHeaderMenuItem,
  IdeMenuBarProps,
  IdeTitleHeaderProps,
  IdePanelToggleGroupProps,
  WindowControlButtonsProps,
  IdeWindowHeaderProps,
} from './ide';

// ============================================================================
// 2. [Document Web Mode] 일반 웹 문서형 탑 툴바 & 뷰모드/동기화 배지
// ============================================================================
export { DocumentTopBar, TopMenuBar } from './web/DocumentTopBar';
export { ViewModeSwitch } from './web/ViewModeSwitch';
export { SyncStatusBadge } from './web/SyncStatusBadge';
export type {
  DocumentTopBarProps,
  TopMenuBarProps,
  ViewModeOption,
  ViewModeSwitchProps,
  SyncStatusType,
  SyncStatusBadgeProps,
} from './web/types';
