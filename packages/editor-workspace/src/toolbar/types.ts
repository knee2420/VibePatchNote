import type { ReactNode } from 'react';

/** 브랜드 로고 부품 Props */
export interface IdeBrandLogoProps {
  /** 로고 아이콘 (기본: Sparkles) */
  icon?: ReactNode;
  /** 브랜드 이름 텍스트 (기본: 'AGY') */
  name?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
  className?: string;
}

/** IDE 윈도우 드롭다운 메뉴 항목 */
export interface IdeHeaderMenuItem {
  id?: string;
  label: string;
  shortcut?: string;
  dividerAfter?: boolean;
}

/** IDE 텍스트 메뉴바 부품 Props */
export interface IdeMenuBarProps {
  /** 상단 메뉴 레이블 목록 */
  items?: string[];
  /** 메뉴 선택 콜백 */
  onSelectMenu?: (item: string) => void;
  className?: string;
}

/** 중앙 타이틀 헤더 부품 Props */
export interface IdeTitleHeaderProps {
  /** 워크스페이스 타이틀 (기본: 'VibePatchNote - Antigravity IDE') */
  workspaceTitle?: string;
  /** 현재 활성 문서명/파일명 */
  activeFileName?: string;
  /** 커스텀 자식 요소 (제공 시 기본 텍스트 대체) */
  children?: ReactNode;
  className?: string;
}

/** 4대 패널 토글 버튼 그룹 부품 Props */
export interface IdePanelToggleGroupProps {
  /** 좌측 기본 사이드바(탐색기/바인더) 열림 여부 및 토글 */
  showPrimarySidebar?: boolean;
  onTogglePrimarySidebar?: () => void;

  /** 하단 패널(터미널/진단/레시피) 열림 여부 및 토글 */
  showBottomPanel?: boolean;
  onToggleBottomPanel?: () => void;

  /** 리소스 매니저 패널 열림 여부 및 토글 */
  showResourceManager?: boolean;
  onToggleResourceManager?: () => void;

  /** 우측 보조 사이드바(AI 감사/코파일럿) 열림 여부 및 토글 */
  showSecondarySidebar?: boolean;
  onToggleSecondarySidebar?: () => void;

  className?: string;
}

/** 윈도우 OS 창 제어 버튼 부품 Props */
export interface WindowControlButtonsProps {
  /** 최소화 콜백 */
  onMinimize?: () => void;
  /** 최대화 콜백 */
  onMaximize?: () => void;
  /** 닫기 콜백 */
  onClose?: () => void;
  className?: string;
}

/** IDE 윈도우 헤더 (조립 완제품) Props */
export interface IdeWindowHeaderProps extends IdePanelToggleGroupProps, WindowControlButtonsProps {
  /** 현재 활성 문서명/파일명 */
  activeFileName?: string;
  /** 워크스페이스 타이틀 */
  workspaceTitle?: string;
  /** 브랜드 로고 슬롯 (기본: AGY Sparkles 로고) */
  brandLogo?: ReactNode;
  /** 상단 텍스트 메뉴 항목 목록 */
  menuItems?: string[];
  /** 뒤로가기 콜백 */
  onBack?: () => void;
  className?: string;
}
