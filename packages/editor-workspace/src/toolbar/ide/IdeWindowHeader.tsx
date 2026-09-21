import type { IdeWindowHeaderProps } from './types';
import {
  IdeBrandLogo,
  IdeMenuBar,
  IdeTitleHeader,
  IdePanelToggleGroup,
  WindowControlButtons,
} from './primitives';

/**
 * [IDE Mode] 데스크톱 IDE 스타일의 고밀도 최상단 윈도우 헤더 (TopBar).
 * 
 * 5대 독립 Primitives를 기본 조립한 완제품 컴포넌트입니다.
 * - 좌측: IdeBrandLogo + IdeMenuBar
 * - 중앙: IdeTitleHeader
 * - 우측: IdePanelToggleGroup + WindowControlButtons
 * 
 * 필요에 따라 `IdeWindowHeader.Brand`, `IdeWindowHeader.Menu` 등 Compound Component로도 자유롭게 분해 조립할 수 있습니다.
 */
export function IdeWindowHeader({
  activeFileName = 'EditorLabPage.tsx',
  workspaceTitle = 'VibePatchNote - Antigravity IDE',
  brandLogo,
  menuItems,
  showPrimarySidebar = true,
  onTogglePrimarySidebar,
  showBottomPanel = false,
  onToggleBottomPanel,
  showResourceManager = false,
  onToggleResourceManager,
  showSecondarySidebar = true,
  onToggleSecondarySidebar,
  onMinimize,
  onMaximize,
  onClose,
  className = '',
}: IdeWindowHeaderProps) {
  return (
    <header
      className={`h-8.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 text-xs select-none text-slate-300 shrink-0 z-30 ${className}`}
    >
      {/* 1. 좌측 브랜드 로고 및 윈도우 메뉴 바 */}
      <div className="flex items-center gap-1">
        {brandLogo !== undefined ? brandLogo : <IdeBrandLogo />}
        <IdeMenuBar items={menuItems} />
      </div>

      {/* 2. 중앙 워크스페이스 및 파일 타이틀 */}
      <IdeTitleHeader
        workspaceTitle={workspaceTitle}
        activeFileName={activeFileName}
      />

      {/* 3. 우측 4대 패널 토글 및 윈도우 OS 컨트롤 */}
      <div className="flex items-center gap-1.5">
        <IdePanelToggleGroup
          showPrimarySidebar={showPrimarySidebar}
          onTogglePrimarySidebar={onTogglePrimarySidebar}
          showBottomPanel={showBottomPanel}
          onToggleBottomPanel={onToggleBottomPanel}
          showResourceManager={showResourceManager}
          onToggleResourceManager={onToggleResourceManager}
          showSecondarySidebar={showSecondarySidebar}
          onToggleSecondarySidebar={onToggleSecondarySidebar}
        />

        <div className="h-3.5 w-[1px] bg-slate-800 mx-1" />

        <WindowControlButtons
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          onClose={onClose}
        />
      </div>
    </header>
  );
}

// Compound Component 패턴 지원 (자유 조립용 하위 부품 바인딩)
IdeWindowHeader.Brand = IdeBrandLogo;
IdeWindowHeader.Menu = IdeMenuBar;
IdeWindowHeader.Title = IdeTitleHeader;
IdeWindowHeader.Panels = IdePanelToggleGroup;
IdeWindowHeader.Controls = WindowControlButtons;
