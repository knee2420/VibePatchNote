/**
 * @file App.tsx
 * @description outliner-builder 메인 애플리케이션 진입 레이아웃
 * - 보관함(폴더)이 없으면 첫 화면에서 폴더를 고르게 하고, 열린 뒤에는 저장 버튼 없이 자동 저장
 * - Two-pane 메인 틀: 좌측 File Explorer 사이드바 + 우측 아웃라인 캔버스
 * - 페이지 전환 없는 매끄러운 프로젝트 인플레이스 스위칭(In-place Switching)
 */

import React, { useState } from 'react';
import {
  FileStorageNotice,
  FileStorageToolbar,
  VaultWelcome,
  useAutoSave,
  useFileIO,
} from '@/features/file-storage';
import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';
import {
  ProjectTreeSidebar,
  FocusedProjectViewport,
  VersionHistoryDrawer,
} from '@/features/workspace-explorer';
import {
  OutlineTree,
  OutlineBreadcrumb,
  OutlineBoard,
  useOutlineView,
  useNodeLinkNavigation,
} from '@/features/outline-editor';
import { Command, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // 보관함 연결 및 자동 저장 훅 바인딩
  const { status } = useAutoSave();
  const {
    isRestoring,
    isTemporary,
    isVaultSupported,
    recentVaultName,
    openVault,
    reopenRecentVault,
    startTemporary,
    importJson,
    exportJson,
    failure,
    dismissFailure,
  } = useFileIO();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 에디터는 독립 문서를 갖지 않는다. 워크스페이스의 활성 프로젝트를 그대로 들여다본다.
  const hasVault = useWorkspaceStore((s) => s.vaultHandle !== null);
  const activeProject = useActiveProject();
  const updateTitle = useWorkspaceStore((s) => s.updateActiveProjectTitle);
  // 불릿으로 볼지 보드로 볼지: 줌인한 불릿에 지정된 방식이 있으면 그것을, 없으면 프로젝트 기본값을 따른다.
  const { view: defaultView, toggleView: toggleViewMode } = useOutlineView();
  // "내부 링크 복사"로 만든 주소로 들어오면 그 불릿으로 이동한다.
  useNodeLinkNavigation(hasVault || isTemporary);

  // 보관함이 아직 없으면 에디터 대신 폴더를 고르는 첫 화면을 보여준다.
  if (!hasVault && !isTemporary) {
    return (
      <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        <FileStorageNotice failure={failure} onDismiss={dismissFailure} />
        <VaultWelcome
          isRestoring={isRestoring}
          isSupported={isVaultSupported}
          recentVaultName={recentVaultName}
          onOpenVault={openVault}
          onReopenRecent={reopenRecentVault}
          onStartTemporary={startTemporary}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 overflow-hidden">
      {/* 1. 상단 보관함 툴바 */}
      <FileStorageToolbar
        status={status}
        onOpenVault={openVault}
        onExport={exportJson}
        onImport={importJson}
      />
      <FileStorageNotice failure={failure} onDismiss={dismissFailure} />

      {/* 2. 메인 Two-Pane 작업대 틀: 좌측 File Explorer + 우측 에디터 캔버스 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* [좌측] 상시 프로젝트 트리 탐색기 (File Explorer 메타포) */}
        <ProjectTreeSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* [우측] 현재 활성 프로젝트의 아웃라인 캔버스 (In-place Switching) */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <FocusedProjectViewport
            title={activeProject.title}
            onUpdateTitle={updateTitle}
            defaultView={defaultView}
            onToggleViewMode={toggleViewMode}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {/* 상단 빵가루 네비게이션 */}
            <div className="mb-4 pb-2 border-b border-slate-900/60 flex items-center justify-between">
              <OutlineBreadcrumb />
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spine Canvas</span>
              </div>
            </div>

            {/* 아웃라인 캔버스 에디터: 뷰 모드(불릿 vs 보드) 분기 */}
            {defaultView === 'board' ? <OutlineBoard /> : <OutlineTree />}
          </FocusedProjectViewport>
        </div>
      </div>

      {/* 3. 온디맨드 버전 타임머신 서랍 (오버레이) */}
      <VersionHistoryDrawer />

      {/* 4. 하단 상태 및 단축키 안내 풋터 */}
      <footer className="h-9 border-t border-slate-900 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-500 select-none shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Enter</kbd>
            <span>새 블록</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Tab</kbd>
            <span>들여쓰기</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Shift+Tab</kbd>
            <span>내어쓰기</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Backspace</kbd>
            <span>병합/삭제</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">• 클릭</kbd>
            <span>줌인</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Command className="w-3 h-3 text-slate-600" />
          <span>v0.2.0 (File Explorer Architecture)</span>
        </div>
      </footer>
    </div>
  );
};
