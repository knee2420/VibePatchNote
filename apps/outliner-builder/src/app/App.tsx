/**
 * @file App.tsx
 * @description outliner-builder 메인 애플리케이션 진입 레이아웃
 * - 보관함(폴더)이 없으면 첫 화면에서 폴더를 고르게 하고, 열린 뒤에는 저장 버튼 없이 자동 저장
 * - Two-pane 메인 틀: 좌측 File Explorer 사이드바 + 우측 아웃라인 캔버스
 * - 페이지 전환 없는 매끄러운 프로젝트 인플레이스 스위칭(In-place Switching)
 */

import React, { useState } from 'react';
import {
  ExportDialog,
  FileStorageNotice,
  FileStorageToolbar,
  ImportDialog,
  VaultWelcome,
  useAutoSave,
  useFileIO,
} from '@/features/file-storage';
import {
  outlineEditorStore,
  outlineHost,
  useActiveProject,
  useNodeLinkNavigation,
  useWorkspaceStore,
} from '@/entities/workspace';
import { ProjectTreeSidebar, FocusedProjectViewport } from '@/features/workspace-explorer';
import {
  OutlineBoard,
  OutlineEditorProvider,
  OutlineTree,
  useOutlineView,
} from '@vibe/outliner/editor';
import { Command } from 'lucide-react';

interface ScaffoldPaneProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/** 지금 보는 스캐폴드의 편집 화면. 편집 상태를 읽으므로 편집 공급자 안에서 그린다. */
const ScaffoldPane: React.FC<ScaffoldPaneProps> = ({
  title,
  onUpdateTitle,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  // 불릿으로 볼지 보드로 볼지: 줌인한 불릿에 지정된 방식이 있으면 그것을, 없으면 스캐폴드 기본값을 따른다.
  const { view } = useOutlineView();

  return (
    <FocusedProjectViewport
      title={title}
      onUpdateTitle={onUpdateTitle}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={onToggleSidebar}
    >
      {/* 아웃라인 캔버스 에디터: 뷰 모드(불릿 vs 보드) 분기 */}
      {view === 'board' ? <OutlineBoard /> : <OutlineTree />}
    </FocusedProjectViewport>
  );
};

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
    openImportedInVault,
    openImportedTemporary,
    failure,
    dismissFailure,
  } = useFileIO();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 내보내기·가져오기 대화상자 (한 번에 하나만 뜬다)
  const [exchangeDialog, setExchangeDialog] = useState<'export' | 'import' | null>(null);

  // 에디터는 독립 문서를 갖지 않는다. 워크스페이스의 활성 프로젝트를 그대로 들여다본다.
  const hasVault = useWorkspaceStore((s) => s.vaultHandle !== null);
  const activeProject = useActiveProject();
  const updateTitle = useWorkspaceStore((s) => s.updateActiveProjectTitle);
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
    <div className="h-screen flex flex-col bg-(--background-primary) text-(--text-normal) font-[var(--font-interface-theme)] selection:bg-(--interactive-accent)/30 overflow-hidden theme-dark">
      {/* 1. 상단 보관함 툴바 */}
      <FileStorageToolbar
        status={status}
        onOpenVault={openVault}
        onExport={() => setExchangeDialog('export')}
        onImport={() => setExchangeDialog('import')}
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
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 custom-scroll">
          <OutlineEditorProvider
            store={outlineEditorStore}
            host={outlineHost}
            rootNodes={activeProject.rootNodes}
            defaultView={activeProject.defaultView}
          >
            <ScaffoldPane
              title={activeProject.title}
              onUpdateTitle={updateTitle}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </OutlineEditorProvider>
        </div>
      </div>

      {/* 3. 내보내기·가져오기 대화상자 */}
      {exchangeDialog === 'export' && <ExportDialog onClose={() => setExchangeDialog(null)} />}
      {exchangeDialog === 'import' && (
        <ImportDialog
          onOpenInVault={openImportedInVault}
          onOpenTemporary={openImportedTemporary}
          onClose={() => setExchangeDialog(null)}
        />
      )}

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
