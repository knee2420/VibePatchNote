import type { IdeDockLayoutProps } from './types';
import { IdeResizerHandle } from './primitives/IdeResizerHandle';

/**
 * [IDE Mode] 데스크톱 IDE 스타일의 수평 5단 도킹 분할 뼈대 레이아웃.
 * 
 * - 1단: 최좌측 전역 액티비티 바 (48px)
 * - 2단: 좌측 기본 사이드바 (가변 너비 + 마우스 리사이저 핸들 + 슬라이드 드로어)
 * - 3단: 중앙 메인 작업 영역 (에디터 + 하단 도킹 패널)
 * - 4단: 리소스 매니저 패널 (가변 너비 + 앰버 리사이저 핸들)
 * - 5단: 우측 보조 사이드바 (가변 너비 + 마우스 리사이저 핸들)
 * - 6단: 최우측 보조 액티비티 바 (46px)
 */
export function IdeDockLayout({
  leftActivityBar,
  showPrimarySidebar = true,
  primarySidebarWidth = 280,
  primarySidebar,
  onMouseDownPrimaryResizer,
  primaryDrawer,
  children,
  showResourceManager = false,
  resourceManagerWidth = 320,
  resourceManager,
  onMouseDownResourceResizer,
  showSecondarySidebar = false,
  secondarySidebarWidth = 340,
  secondarySidebar,
  onMouseDownSecondaryResizer,
  rightActivityBar,
  className = '',
}: IdeDockLayoutProps) {
  return (
    <div className={`flex-1 flex overflow-hidden relative w-full h-full ${className}`}>
      {/* 1. 최좌측 전역 액티비티 바 */}
      {leftActivityBar}

      {/* 2. 좌측 기본 사이드바 (Explorer/Binder/Recipe) */}
      {showPrimarySidebar && (
        <>
          <aside
            style={{ width: `${primarySidebarWidth}px` }}
            className="h-full shrink-0 border-r border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
          >
            {primarySidebar}
          </aside>

          {/* 좌측 슬라이드 드로어 (바인더 옆 레퍼런스 모달 등) */}
          {primaryDrawer}

          {/* 좌측 사이드바 마우스 리사이저 핸들 */}
          {onMouseDownPrimaryResizer && (
            <IdeResizerHandle
              orientation="vertical"
              onMouseDown={onMouseDownPrimaryResizer}
              title="드래그하여 탐색기 패널 너비 조절"
            />
          )}
        </>
      )}

      {/* 3. 중앙 메인 작업 영역 (멀티 Pane 에디터 + 하단 패널) */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>

      {/* 4. 리소스 매니저 패널 (중앙 에디터와 우측 AI 패널 사이) */}
      {showResourceManager && (
        <>
          {onMouseDownResourceResizer && (
            <IdeResizerHandle
              orientation="vertical"
              onMouseDown={onMouseDownResourceResizer}
              title="드래그하여 리소스 매니저 너비 조절"
              colorVariant="amber"
              className="-mr-1"
            />
          )}

          <aside
            style={{ width: `${resourceManagerWidth}px` }}
            className="h-full shrink-0 border-l border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
          >
            {resourceManager}
          </aside>
        </>
      )}

      {/* 5. 우측 보조 사이드바 (Antigravity AI / Grammarly 패널) */}
      {showSecondarySidebar && (
        <>
          {onMouseDownSecondaryResizer && (
            <IdeResizerHandle
              orientation="vertical"
              onMouseDown={onMouseDownSecondaryResizer}
              title="드래그하여 보조 사이드바 너비 조절"
              className="-mr-1"
            />
          )}

          <aside
            style={{ width: `${secondarySidebarWidth}px` }}
            className="h-full shrink-0 border-l border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
          >
            {secondarySidebar}
          </aside>
        </>
      )}

      {/* 6. 최우측 보조 액티비티 바 */}
      {rightActivityBar}
    </div>
  );
}

// Compound 바인딩
IdeDockLayout.Resizer = IdeResizerHandle;
