import { useState } from 'react';
import {
  X,
  SplitSquareVertical,
  MoreHorizontal,
  FileCode,
  ArrowRight,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import type { EditorTabItem, DragPayload } from '../model/types';

export interface IdeTabBarProps {
  pane: 'pane1' | 'pane2';
  tabs: EditorTabItem[];
  activeId: string;
  isSplitEditor: boolean;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string, e?: React.MouseEvent) => void;
  onMoveTab: (tabId: string, fromPane: 'pane1' | 'pane2', toPane: 'pane1' | 'pane2') => void;
  onReorderTab: (
    sourceTabId: string,
    targetTabId: string | null,
    sourcePane: 'pane1' | 'pane2',
    targetPane: 'pane1' | 'pane2',
    position: 'before' | 'after'
  ) => void;
  onToggleSplitEditor: () => void;
}

export function IdeTabBar({
  pane,
  tabs,
  activeId,
  isSplitEditor,
  onSelectTab,
  onCloseTab,
  onMoveTab,
  onReorderTab,
  onToggleSplitEditor,
}: IdeTabBarProps) {
  // 드래그 중인 탭과 드롭 대상 탭의 위치 상태 (좌/우 삽입 인디케이터)
  const [dragOverInfo, setDragOverInfo] = useState<{
    tabId: string;
    position: 'before' | 'after';
  } | null>(null);

  // 개별 탭 드래그 오버 핸들러 (좌우 50% 분할 판단)
  const handleTabDragOver = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const position: 'before' | 'after' = mouseX < rect.width / 2 ? 'before' : 'after';

    if (!dragOverInfo || dragOverInfo.tabId !== tabId || dragOverInfo.position !== position) {
      setDragOverInfo({ tabId, position });
    }
  };

  const handleTabDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // 자식 요소로의 이동이 아닌 탭 자체를 벗어날 때만 인디케이터 해제
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverInfo(null);
    }
  };

  // 개별 탭 위로 드롭 시 (순서 교체 / 특정 위치 삽입)
  const handleTabDrop = (e: React.DragEvent<HTMLDivElement>, targetTabId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const currentPos = dragOverInfo?.position || 'before';
    setDragOverInfo(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const payload: DragPayload = JSON.parse(dataStr);

      if (payload.type === 'tab') {
        onReorderTab(payload.tabId, targetTabId, payload.sourcePane, pane, currentPos);
      }
    } catch {
      // ignore JSON parse error
    }
  };

  // 탭 목록 빈 영역에 드롭 시 (해당 Pane의 맨 끝으로 이동)
  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverInfo(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const payload: DragPayload = JSON.parse(dataStr);

      if (payload.type === 'tab') {
        onReorderTab(payload.tabId, null, payload.sourcePane, pane, 'after');
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-8.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between overflow-x-auto shrink-0 select-none">
      {/* 탭 목록 컨테이너 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleContainerDrop}
        className="flex items-center h-full flex-1 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const isTargeted = dragOverInfo?.tabId === tab.id;

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({ type: 'tab', tabId: tab.id, sourcePane: pane })
                );
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => handleTabDragOver(e, tab.id)}
              onDragLeave={handleTabDragLeave}
              onDrop={(e) => handleTabDrop(e, tab.id)}
              onClick={() => onSelectTab(tab.id)}
              className={`h-full relative flex items-center gap-1.5 px-3 border-r border-slate-800/80 text-xs cursor-pointer group transition-colors shrink-0 ${
                isActive
                  ? 'bg-slate-950 text-slate-100 border-t-2 border-t-indigo-500 font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              title="드래그하여 탭 순서 변경 및 다른 분할 창으로 이동 가능"
            >
              {/* 드롭 인디케이터 라인 (VS Code 스타일 파란색 세로선) */}
              {isTargeted && dragOverInfo?.position === 'before' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
              {isTargeted && dragOverInfo?.position === 'after' && (
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-indigo-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}

              {/* 탭 아이콘 */}
              {tab.type === 'wireframe' ? (
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : tab.language === 'html' ? (
                <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              ) : tab.language === 'markdown' ? (
                <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : tab.language === 'json' ? (
                <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}

              {/* 페이지 번호 뱃지 */}
              {tab.pageNumber && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-mono font-bold shrink-0">
                  P.{tab.pageNumber}
                </span>
              )}

              {/* 파일명 */}
              <span className="truncate max-w-[140px]">{tab.name}</span>
              {tab.isModified && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:hidden" />}

              {/* 반대편 창으로 즉시 이전 버튼 (호버 시 표시) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveTab(tab.id, pane, pane === 'pane1' ? 'pane2' : 'pane1');
                }}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-300 hidden group-hover:block"
                title={pane === 'pane1' ? '우측 창으로 이전' : '좌측 창으로 이전'}
              >
                {pane === 'pane1' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
              </button>

              {/* 탭 닫기 버튼 */}
              <button
                type="button"
                onClick={(e) => onCloseTab(tab.id, e)}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Close (Ctrl+W)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {tabs.length === 0 && (
          <div className="px-3 text-xs text-slate-500 italic">
            파일을 이곳으로 드래그하여 열기
          </div>
        )}
      </div>

      {/* 탭 우측 액션 버튼 */}
      <div className="flex items-center gap-1 px-2 text-slate-400 shrink-0">
        <button
          type="button"
          onClick={onToggleSplitEditor}
          className={`p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer ${
            isSplitEditor ? 'text-indigo-400 bg-slate-800' : ''
          }`}
          title="Split Editor Right (Ctrl+\)"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
          title="More Actions..."
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
