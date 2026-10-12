/**
 * @file FocusedProjectViewport.tsx
 * @description 단일 프로젝트의 불릿 트리를 집중 렌더링하는 에디터 뷰포트 레이아웃
 * FSD 원칙: 에디터 본문은 Slot(children)으로 수신한다.
 */

import React from 'react';
import {
  Camera,
  History,
  LayoutGrid,
  List,
  PanelLeftClose,
  PanelLeft,
  FolderTree,
} from 'lucide-react';
import { diffSnapshots } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

interface FocusedProjectViewportProps {
  children?: React.ReactNode;
  title: string;
  onUpdateTitle: (title: string) => void;
  defaultView?: 'bullets' | 'board';
  onToggleViewMode?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const EMPTY_SNAPSHOTS: any[] = [];

export const FocusedProjectViewport: React.FC<FocusedProjectViewportProps> = ({
  children,
  title,
  onUpdateTitle,
  defaultView = 'bullets',
  onToggleViewMode,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const activeProjectId = workspace.activeProjectId;
  const focusProject = useWorkspaceStore((s) => s.focusProject);
  const snapshots = workspace.snapshots[activeProjectId] ?? EMPTY_SNAPSHOTS;
  const openHistoryDrawer = useWorkspaceStore((s) => s.openHistoryDrawer);
  const takeSnapshot = useWorkspaceStore((s) => s.takeSnapshot);

  const currentProject = workspace.projects[activeProjectId];
  const ancestorProjects = React.useMemo(() => {
    const chain: (typeof currentProject)[] = [];
    let curr = currentProject?.parentProjectId
      ? workspace.projects[currentProject.parentProjectId]
      : null;
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(curr);
      curr = curr.parentProjectId ? workspace.projects[curr.parentProjectId] : null;
    }
    return chain.filter(Boolean);
  }, [currentProject, workspace.projects]);

  const currentRoots = currentProject.rootNodes;
  const latestSnapshot = snapshots[0];
  const latestLabel =
    latestSnapshot?.milestoneName ??
    (latestSnapshot ? `스냅샷 #${snapshots.length}` : '초기 버전');

  // 직전 스냅샷 대비 실시간 변경사항 계산
  const diffFromLatest = React.useMemo(() => {
    if (!latestSnapshot) return null;
    return diffSnapshots(latestSnapshot.rootNodes, currentRoots);
  }, [latestSnapshot, currentRoots]);

  const changeCount = diffFromLatest
    ? diffFromLatest.addedCount +
      diffFromLatest.modifiedCount +
      diffFromLatest.removedCount
    : 0;

  const handleQuickSnapshot = () => {
    const summary = window.prompt('스냅샷 요약을 입력하세요 (선택):');
    takeSnapshot(activeProjectId, undefined, summary ?? undefined);
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 flex flex-col min-w-0">
      {/* 1. 상단 프로젝트 컨트롤 헤더 */}
      <div className="mb-4 pb-3 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* 사이드바 토글 버튼 */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer shrink-0"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          )}

          {/* 상위 조상 프로젝트 네비게이션 빵가루 (하위 프로젝트일 경우) */}
          {ancestorProjects.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 select-none">
              {ancestorProjects.map((anc) => (
                <React.Fragment key={anc.id}>
                  <button
                    type="button"
                    onClick={() => focusProject(anc.id)}
                    title={`상위 프로젝트 '${anc.title}'로 이동`}
                    className="hover:text-cyan-400 flex items-center gap-1 text-slate-400 hover:underline transition-colors cursor-pointer"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate max-w-[120px] font-medium">{anc.title}</span>
                  </button>
                  <span className="text-slate-600">/</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* 프로젝트 제목 인라인 편집 */}
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="프로젝트 제목"
            className="text-base sm:text-lg font-bold bg-transparent text-slate-100 hover:bg-slate-900/60 focus:bg-slate-900 px-2.5 py-1 rounded-md border border-transparent focus:border-indigo-500 focus:outline-hidden transition-all truncate min-w-0"
          />
        </div>

        {/* 우측 버전 알약 & 뷰 모드 토글 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 뷰 모드 토글 버튼 (불릿 vs 보드) */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              title={`현재: ${defaultView === 'board' ? '칸반 보드 뷰' : '불릿 아웃라인 뷰'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
            >
              {defaultView === 'board' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">보드 뷰</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">불릿 뷰</span>
                </>
              )}
            </button>
          )}

          {/* 버전 히스토리 알약 버튼 */}
          <button
            type="button"
            onClick={openHistoryDrawer}
            title={
              changeCount > 0
                ? `직전 스냅샷 대비 ${changeCount}개 항목 변경됨 (클릭하여 이력 관리)`
                : '스냅샷과 완전히 일치함 (클릭하여 이력 관리)'
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>{latestLabel}</span>
            {changeCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span>
                  +{diffFromLatest?.addedCount} ~{diffFromLatest?.modifiedCount}
                  {diffFromLatest?.removedCount ? ` -${diffFromLatest.removedCount}` : ''}
                </span>
              </span>
            ) : (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"
                title="스냅샷과 일치 (Clean)"
              />
            )}
          </button>

          {/* 빠른 스냅샷 저장 */}
          <button
            type="button"
            onClick={handleQuickSnapshot}
            title="현재 시점 즉시 스냅샷 저장"
            className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 아웃라인 트리 작업대 (Slot 합성 영역) */}
      <div className="flex-1 bg-slate-900/20 rounded-xl border border-slate-800/60 p-6 shadow-2xl backdrop-blur-sm flex flex-col min-h-0">
        {children}
      </div>
    </main>
  );
};
