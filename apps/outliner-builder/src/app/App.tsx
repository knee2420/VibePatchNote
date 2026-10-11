/**
 * @file App.tsx
 * @description outliner-builder 메인 애플리케이션 진입 레이아웃
 */

import React from 'react';
import { FileStorageNotice, FileStorageToolbar, useAutoSave, useFileIO } from '@/features/file-storage';
import { OutlineTree, OutlineBreadcrumb } from '@/features/outline-editor';
import { Sparkles, Command } from 'lucide-react';

export const App: React.FC = () => {
  // 로컬 파일 입출력 및 자동 저장 훅 바인딩
  const { status } = useAutoSave();
  const {
    createNewDocument,
    openLocalFile,
    saveAsLocalFile,
    exportJson,
    triggerClassicUpload,
    failure,
    dismissFailure,
  } = useFileIO();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* 1. 상단 파일 스토리지 툴바 */}
      <FileStorageToolbar
        status={status}
        onNew={createNewDocument}
        onOpen={openLocalFile}
        onSaveAs={saveAsLocalFile}
        onExport={exportJson}
        onImport={triggerClassicUpload}
      />
      <FileStorageNotice failure={failure} onDismiss={dismissFailure} />

      {/* 2. 메인 아웃라인 캔버스 영역 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-6 flex flex-col">
        {/* 상단 빵가루 네비게이션 */}
        <div className="mb-4 pb-2 border-b border-slate-900 flex items-center justify-between">
          <OutlineBreadcrumb />
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Local-First Spine</span>
          </div>
        </div>

        {/* 아웃라인 트리 작업대 */}
        <div className="flex-1 bg-slate-900/20 rounded-xl border border-slate-800/60 p-6 shadow-2xl backdrop-blur-sm">
          <OutlineTree />
        </div>
      </main>

      {/* 3. 하단 상태 및 단축키 안내 풋터 */}
      <footer className="h-9 border-t border-slate-900 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Enter</kbd>
            <span>새 항목</span>
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
          <span>v0.1.0 (Phase 1 MVP)</span>
        </div>
      </footer>
    </div>
  );
};
