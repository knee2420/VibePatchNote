/**
 * @file FileStorageToolbar.tsx
 * @description 로컬 파일 I/O 및 저장 상태 제어 헤더 툴바 UI 컴포넌트
 */

import React from 'react';
import { FolderOpen, Save, Download, Upload, PlusCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useTreeStore } from '@/entities/outline-document';
import { type SaveStatus } from '../model/useAutoSave';

interface FileStorageToolbarProps {
  status: SaveStatus;
  onNew: () => void;
  onOpen: () => void;
  onSaveAs: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const FileStorageToolbar: React.FC<FileStorageToolbarProps> = ({
  status,
  onNew,
  onOpen,
  onSaveAs,
  onExport,
  onImport,
}) => {
  const title = useTreeStore((s) => s.document.title);
  const updateTitle = useTreeStore((s) => s.updateTitle);

  const handleNewDocument = () => {
    if (confirm('새 아웃라인 문서를 만드시겠습니까? 저장되지 않은 내용은 사라질 수 있습니다.')) {
      onNew();
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* 1. 좌측: 문서 제목 인풋 */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="제목 없는 아웃라인"
          className="text-base font-semibold text-slate-100 bg-transparent hover:bg-slate-900/60 focus:bg-slate-900 px-2.5 py-1 rounded-md border border-transparent focus:border-slate-700 outline-none transition-all w-full truncate"
        />

        {/* 2. 저장 상태 뱃지 */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium shrink-0">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              <span>저장됨</span>
            </span>
          )}
          {status === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded animate-pulse">
              <Clock className="w-3 h-3" />
              <span>저장 중...</span>
            </span>
          )}
          {status === 'dirty' && (
            <span className="flex items-center gap-1 text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>수정됨</span>
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>저장 실패</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. 우측: 파일 액션 버튼 그룹 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleNewDocument}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
          title="새 아웃라인 생성"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">새로 만들기</span>
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
          title="로컬 JSON 파일 열기"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">열기</span>
        </button>

        <button
          type="button"
          onClick={onSaveAs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
          title="로컬 디스크에 파일로 저장"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">저장</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
          title="JSON DTO 다운로드 내보내기"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">내보내기</span>
        </button>

        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
          title="JSON DTO 파일 가져오기"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">가져오기</span>
        </button>
      </div>
    </header>
  );
};
