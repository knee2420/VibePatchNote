/**
 * @file ImportDialog.tsx
 * @description "가져오기" 대화상자 — 파일이나 폴더를 고르고, 열기 전에 무엇이 들어오는지 본다.
 * 가져온 것은 지금 워크스페이스와 섞이지 않고 언제나 새 워크스페이스로 열린다.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Workspace } from '@vibe/outliner/core';
import type { ImportSkippedFile } from '@vibe/outliner/dto';
import { AlertCircle, File, FolderOpen, Info, X } from 'lucide-react';
import type { OpenImportedResult } from '../model/useFileIO';
import { type ImportProblem, useImport } from '../model/useImport';

interface ImportDialogProps {
  onOpenInVault: (workspace: Workspace) => Promise<OpenImportedResult>;
  onOpenTemporary: (workspace: Workspace) => Promise<OpenImportedResult>;
  onClose: () => void;
}

function describeSkip(file: ImportSkippedFile): string {
  switch (file.reason) {
    case 'parse-error':
      return 'JSON 이 깨져 있습니다';
    case 'not-a-project':
      return '스캐폴드 파일이 아닙니다';
    case 'unsupported-version':
      return `읽을 수 없는 버전입니다 (${file.version ?? '?'})`;
    case 'duplicate-id':
      return '같은 스캐폴드가 다른 파일에도 있어 더 최근 것만 받습니다';
  }
}

function describeProblem(problem: ImportProblem): string {
  switch (problem) {
    case 'read-failed':
      return '고른 파일이나 폴더를 읽지 못했습니다.';
    case 'folder-not-empty':
      return '고른 폴더에는 이미 스캐폴드가 있습니다. 비어 있는 폴더를 골라주세요.';
    case 'open-failed':
      return '새 워크스페이스를 열지 못했습니다.';
  }
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  onOpenInVault,
  onOpenTemporary,
  onClose,
}) => {
  const {
    canPickFolder,
    hasUnsavedWork,
    stage,
    problem,
    isBusy,
    pickFiles,
    pickFolder,
    pickAgain,
    open,
  } = useImport({ onOpenInVault, onOpenTemporary, onOpened: onClose });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const result = stage.kind === 'preview' ? stage.result : null;

  return createPortal(
    <div
      data-row-control
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="outline-menu-pop w-full max-w-md mx-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">가져오기</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <p className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              가져온 것은 지금 워크스페이스와 섞이지 않고, 새 워크스페이스로 열립니다.
            </span>
          </p>

          {!result ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pickFiles}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-200 transition-colors cursor-pointer"
              >
                <File className="w-3.5 h-3.5 text-slate-400" />
                <span>JSON 파일 고르기</span>
              </button>
              {canPickFolder && (
                <button
                  type="button"
                  onClick={pickFolder}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>폴더 고르기</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 들어오는 프로젝트 */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <p className="text-[11px] text-slate-400 mb-1">
                  들어오는 스캐폴드 {result.projects.length}개
                </p>
                {result.projects.length === 0 ? (
                  <p className="py-2 text-xs text-slate-500">읽을 수 있는 스캐폴드가 없습니다.</p>
                ) : (
                  result.projects.map((project) => (
                    <div key={project.projectId} className="flex items-center gap-2 py-1 text-xs">
                      <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-slate-200">{project.title}</span>
                        <span className="block truncate text-[10px] text-slate-500">
                          {project.path}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        불릿 {project.nodeCount}개
                      </span>
                    </div>
                  ))
                )}

              </div>

              {/* 읽지 못한 파일 */}
              {result.skipped.length > 0 && (
                <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                  <p className="text-[11px] text-slate-400 mb-1">
                    받지 않은 파일 {result.skipped.length}개
                  </p>
                  {result.skipped.map((file) => (
                    <div key={`${file.path}:${file.reason}`} className="py-1 text-xs">
                      <span className="block truncate text-slate-300">{file.path}</span>
                      <span className="block text-[10px] text-amber-300/90">
                        {describeSkip(file)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.workspace && hasUnsavedWork && (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-300 leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    지금 내용은 폴더에 저장되어 있지 않습니다. 새 워크스페이스를 열면 사라집니다.
                  </span>
                </p>
              )}
            </>
          )}

          {problem && (
            <p role="alert" className="flex items-start gap-1.5 text-[11px] text-amber-300 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{describeProblem(problem)}</span>
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
          {result ? (
            <button
              type="button"
              onClick={pickAgain}
              className="mr-auto px-3 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              다시 고르기
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              취소
            </button>
          )}

          {result?.workspace && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => open('temporary')}
                className="px-3 py-1.5 rounded-md text-xs text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="저장할 폴더는 나중에 '보관함 열기'로 정할 수 있습니다"
              >
                폴더 없이 열기
              </button>
              {canPickFolder && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => open('vault')}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  저장할 폴더를 골라 열기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
