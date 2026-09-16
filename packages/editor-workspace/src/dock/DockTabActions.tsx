import { useState } from 'react';
import { Maximize2, Minimize2, X, Columns2, Pin } from 'lucide-react';
import type { IDockviewHeaderActionsProps } from './types';

/**
 * VS Code 스타일의 Dock 탭 헤더 우측 액션 툴바.
 * 창 분할, 뷰포트 고정(Pin/Lock), 최대화/복원, 현재 탭 닫기 버튼을 제공합니다.
 */
export function DockTabActions(props: IDockviewHeaderActionsProps) {
  const [isMaximized, setIsMaximized] = useState(() => props.api.isMaximized());
  const [isPinned, setIsPinned] = useState(false);

  const handleToggleMaximize = () => {
    if (props.api.isMaximized()) {
      props.api.exitMaximized();
      setIsMaximized(false);
    } else {
      props.api.maximize();
      setIsMaximized(true);
    }
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const handleCloseActive = () => {
    if (props.activePanel) {
      props.activePanel.api.close();
    }
  };

  const handleSplitRight = () => {
    if (!props.activePanel) return;
    const active = props.activePanel;
    // 현재 활성 패널을 오른쪽으로 분할(새 패널 복제/추가)
    const newId = `${active.id}-split-${Date.now()}`;
    props.containerApi.addPanel({
      id: newId,
      component: (active.params?.component as string) || active.id,
      title: active.title,
      params: active.params,
      position: {
        referencePanel: active.id,
        direction: 'right',
      },
    });
  };

  return (
    <div className="flex items-center gap-0.5 px-1.5 h-full text-slate-500 select-none">
      {/* 1. 참조 뷰포트 고정 (Split Lock / Pin) */}
      <button
        type="button"
        onClick={handleTogglePin}
        className={`p-1 rounded-md transition-colors cursor-pointer ${
          isPinned
            ? 'text-indigo-600 bg-indigo-50'
            : 'hover:bg-slate-100 hover:text-slate-800'
        }`}
        title={isPinned ? '패널 고정 해제' : '패널 고정 (참조 뷰포트 락)'}
      >
        <Pin className="w-3.5 h-3.5" />
      </button>

      {/* 2. 우측 분할 (Split Right) */}
      <button
        type="button"
        onClick={handleSplitRight}
        className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
        title="에디터 우측 분할 (Split Right)"
      >
        <Columns2 className="w-3.5 h-3.5" />
      </button>

      {/* 3. 최대화 / 복원 토글 */}
      <button
        type="button"
        onClick={handleToggleMaximize}
        className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
        title={isMaximized ? '원래 크기로 복원' : '패널 최대화'}
      >
        {isMaximized ? (
          <Minimize2 className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 4. 현재 탭 닫기 */}
      {props.activePanel && (
        <button
          type="button"
          onClick={handleCloseActive}
          className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          title="현재 탭 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
