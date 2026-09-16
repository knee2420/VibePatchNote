import { useCallback, useRef } from 'react';
import { DockviewReact } from 'dockview-react';
import 'dockview/dist/styles/dockview.css';
import './dockview-theme.css';

import type { EditorDockShellProps, DockviewReadyEvent, DockviewApi } from './types';

/**
 * VS Code 스타일의 분할 탭 및 도킹 셸 컴포넌트.
 * 중앙 에디터 영역의 상하/좌우 무한 분할(Split Editor), 탭 드래그 앤 드롭 이동, 도킹을 관리합니다.
 */
export function EditorDockShell({
  onReady,
  components,
  tabComponents,
  rightHeaderActionsComponent,
  theme = 'dockview-theme-light',
  className = '',
  disableFloatingGroups = true,
}: EditorDockShellProps) {
  const apiRef = useRef<DockviewApi | null>(null);

  const handleReady = useCallback(
    (event: DockviewReadyEvent) => {
      apiRef.current = event.api;
      onReady?.(event);
    },
    [onReady]
  );

  return (
    <div className={`w-full h-full relative overflow-hidden ${theme} ${className}`}>
      <DockviewReact
        onReady={handleReady}
        components={components}
        tabComponents={tabComponents}
        rightHeaderActionsComponent={rightHeaderActionsComponent}
        disableFloatingGroups={disableFloatingGroups}
        className="w-full h-full"
      />
    </div>
  );
}
