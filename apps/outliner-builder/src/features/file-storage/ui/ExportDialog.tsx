/**
 * @file ExportDialog.tsx
 * @description "내보내기" 대화상자 — 무엇을 내보낼지 고르고, 누르기 전에 나가는 파일을 본다.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, File, X } from 'lucide-react';
import { type ExportScopeKind, useExport } from '../model/useExport';

interface ExportDialogProps {
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const { projectTitle, zoomTitle, selectionCount, scopeKind, chooseScope, file, outcome, run } =
    useExport();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const scopes: Array<{ kind: ExportScopeKind; label: string; hint: string; enabled: boolean }> = [
    {
      kind: 'subtree',
      label: '줌인한 범위',
      hint: zoomTitle !== null ? `"${zoomTitle}" 아래의 불릿` : '줌인한 불릿이 없습니다',
      enabled: zoomTitle !== null,
    },
    { kind: 'project', label: '스캐폴드 전체', hint: `"${projectTitle}" 전체`, enabled: true },
    {
      kind: 'nodes',
      label: '고른 불릿',
      hint: selectionCount > 0 ? `고른 불릿 ${selectionCount}개와 그 하위` : '고른 불릿이 없습니다',
      enabled: selectionCount > 0,
    },
  ];
  const activeScope = scopes.find((s) => s.kind === scopeKind);

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
          <span className="text-sm font-semibold text-slate-100">내보내기</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* 1. 무엇을 내보낼까 */}
          <div>
            <p className="text-[11px] text-slate-400 mb-1.5">무엇을 내보낼까요</p>
            <div className="flex gap-1.5">
              {scopes.map((scope) => (
                <button
                  key={scope.kind}
                  type="button"
                  disabled={!scope.enabled}
                  title={scope.hint}
                  onClick={() => chooseScope(scope.kind)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    scopeKind === scope.kind
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : scope.enabled
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 cursor-pointer'
                        : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
            {activeScope && <p className="mt-1.5 text-[11px] text-slate-500">{activeScope.hint}</p>}
          </div>

          {/* 2. 나가는 파일 (언제나 하나) */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
            <p className="text-[11px] text-slate-400 mb-1">나가는 파일</p>
            {!file ? (
              <p className="py-2 text-xs text-slate-500">내보낼 것이 없습니다.</p>
            ) : (
              <div className="flex items-center gap-2 py-1 text-xs">
                <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-slate-200">{file.fileName}</span>
                <span className="text-[11px] text-slate-500 shrink-0">
                  불릿 {file.nodeCount}개
                </span>
              </div>
            )}
          </div>

          {outcome !== 'idle' && (
            <p
              role="status"
              className={`flex items-start gap-1.5 text-[11px] leading-relaxed ${
                outcome === 'done' ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {outcome === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{outcome === 'done' ? '파일을 내보냈습니다.' : '내보내지 못했습니다.'}</span>
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {outcome === 'done' ? '닫기' : '취소'}
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={run}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors cursor-pointer"
          >
            내보내기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
