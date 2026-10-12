/**
 * @file FileStorageToolbar.tsx
 * @description 보관함 연결 상태 및 가져오기/내보내기 헤더 툴바 UI 컴포넌트
 */

import React from 'react';
import { FolderOpen, Download, Upload, CheckCircle2, Clock, AlertCircle, Unlink } from 'lucide-react';
import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';
import { type SaveStatus } from '../model/useAutoSave';

interface FileStorageToolbarProps {
  status: SaveStatus;
  onOpenVault: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const FileStorageToolbar: React.FC<FileStorageToolbarProps> = ({
  status,
  onOpenVault,
  onExport,
  onImport,
}) => {
  const title = useActiveProject().title;
  const updateTitle = useWorkspaceStore((s) => s.updateActiveProjectTitle);
  const vaultName = useWorkspaceStore((s) => s.vaultHandle?.name ?? null);

  return (
    <header className="h-14 border-b border-(--background-modifier-border) bg-(--background-secondary)/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* 1. 좌측: 문서 제목 인풋 & 저장 상태 & 보관함/파일 경로 */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-4">
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="제목 없는 아웃라인"
          className="text-base font-semibold font-[var(--font-text-theme)] text-(--text-normal) bg-transparent hover:bg-(--background-modifier-hover) focus:bg-(--background-secondary) px-2.5 py-1 rounded-md border border-transparent focus:border-(--interactive-accent) outline-none transition-all w-auto min-w-[120px] max-w-[220px] shrink-0 truncate"
        />

        {/* 2. 저장 상태 뱃지 */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium shrink-0">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>저장됨</span>
            </span>
          )}
          {status === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <Clock className="w-3 h-3" />
              <span>저장 중...</span>
            </span>
          )}
          {status === 'dirty' && (
            <span className="flex items-center gap-1 text-(--text-muted) bg-(--background-modifier-hover) border border-(--background-modifier-border) px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>수정됨</span>
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              <span>저장 실패</span>
            </span>
          )}
          {status === 'idle' && (
            <span className="flex items-center gap-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <Unlink className="w-3 h-3" />
              <span>임시 모드</span>
            </span>
          )}
        </div>

        {/* 3. 현재 묶인 보관함 폴더 / 파일 경로 (잘림 없이 시원하게 표시) */}
        {vaultName && (
          <div
            className="flex items-center gap-1.5 text-xs text-(--text-normal) bg-(--background-modifier-hover) border border-(--background-modifier-border) px-3 py-1 rounded-md shrink-0 shadow-xs min-w-0"
            title={`연동된 보관함 폴더: ${vaultName} | 프로젝트 파일: ${title || '무제'}.json`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-mono text-[11px] font-medium text-(--text-normal) whitespace-nowrap flex items-center">
              <span className="text-(--text-normal) font-semibold">{vaultName}</span>
              <span className="text-(--text-faint) mx-1.5">/</span>
              <span className="text-(--text-muted) font-normal">{title ? `${title}.json` : 'workspace.json'}</span>
            </span>
          </div>
        )}
      </div>

      {/* 4. 우측: 보관함 및 파일 액션 버튼 그룹 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenVault}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-(--text-normal) hover:bg-(--background-modifier-hover) bg-(--background-secondary) border border-(--background-modifier-border) transition-colors cursor-pointer"
          title="다른 폴더를 보관함으로 열기"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">보관함 열기</span>
        </button>

        <div className="w-[1px] h-4 bg-(--background-modifier-border) mx-1" />

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-(--text-muted) hover:text-(--text-normal) hover:bg-(--background-modifier-hover) transition-colors cursor-pointer"
          title="워크스페이스 전체를 JSON 파일 하나로 내려받기"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">내보내기</span>
        </button>

        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-(--text-muted) hover:text-(--text-normal) hover:bg-(--background-modifier-hover) transition-colors cursor-pointer"
          title="JSON 파일의 프로젝트들을 이 보관함에 더하기"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">가져오기</span>
        </button>
      </div>
    </header>
  );
};
