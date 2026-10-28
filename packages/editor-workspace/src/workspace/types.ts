import type { ReactNode, MouseEvent } from 'react';

/** [Composite] 전체 데스크톱 IDE 윈도우 샌드위치 셸 Props */
export interface IdeWindowShellProps {
  /** 상단 고정 헤더 슬롯 (예: IdeWindowHeader) */
  header?: ReactNode;
  /** 중앙 메인 작업 본문 (예: IdeDockLayout) */
  children: ReactNode;
  /** 하단 고정 상태 바 슬롯 (예: IdeStatusBar) */
  footer?: ReactNode;
  /** 현재 패널 리사이징 드래그 진행 중 여부 (창 전체 텍스트 선택 방지 및 커서 유지) */
  isDraggingResizer?: boolean;
  /** 드래그 중 적용할 커서 ('col-resize' | 'row-resize', 기본값: 'col-resize') */
  dragCursor?: 'col-resize' | 'row-resize';
  className?: string;
}

/** [Composite] 중앙 5단 수평 도킹 뼈대 레이아웃 Props */
export interface IdeDockLayoutProps {
  /** 1. 최좌측 전역 액티비티 바 슬롯 (w-12, 48px) */
  leftActivityBar?: ReactNode;

  /** 2. 좌측 기본 사이드바 표시 여부 */
  showPrimarySidebar?: boolean;
  /** 좌측 기본 사이드바 너비 (px) */
  primarySidebarWidth?: number;
  /** 좌측 사이드바 내용 (예: IdeBinderSidebar 또는 IdeRecipeSidebar) */
  primarySidebar?: ReactNode;
  /** 좌측 사이드바 리사이저 드래그 마우스 다운 핸들러 */
  onMouseDownPrimaryResizer?: (e: MouseEvent<HTMLDivElement>) => void;
  /** 좌측 사이드바 옆 슬라이드 드로어 슬롯 (예: IdeReferenceDocDrawer) */
  primaryDrawer?: ReactNode;

  /** 3. 중앙 메인 작업 영역 슬롯 (에디터 및 하단 도킹 터미널 패널) */
  children: ReactNode;

  /** 4. 리소스 매니저 패널 표시 여부 */
  showResourceManager?: boolean;
  /** 리소스 매니저 패널 너비 (px) */
  resourceManagerWidth?: number;
  /** 리소스 매니저 패널 내용 (예: IdeResourceManager) */
  resourceManager?: ReactNode;
  /** 리소스 매니저 리사이저 드래그 마우스 다운 핸들러 */
  onMouseDownResourceResizer?: (e: MouseEvent<HTMLDivElement>) => void;

  /** 5. 우측 보조 사이드바 표시 여부 */
  showSecondarySidebar?: boolean;
  /** 우측 보조 사이드바 너비 (px) */
  secondarySidebarWidth?: number;
  /** 우측 보조 사이드바 내용 (예: IdeSecondarySidebar) */
  secondarySidebar?: ReactNode;
  /** 우측 보조 사이드바 리사이저 드래그 마우스 다운 핸들러 */
  onMouseDownSecondaryResizer?: (e: MouseEvent<HTMLDivElement>) => void;

  /** 6. 최우측 보조 액티비티 바 슬롯 (w-11.5, 46px) */
  rightActivityBar?: ReactNode;

  className?: string;
}
