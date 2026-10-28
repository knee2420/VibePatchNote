/**
 * @file VaultWelcome.tsx
 * @description 보관함이 아직 없을 때의 첫 화면 — 폴더를 한 번 고르면 이후로는 전부 자동 저장
 */

import React from 'react';
import { FolderOpen, History, AlertCircle } from 'lucide-react';

interface VaultWelcomeProps {
  isRestoring: boolean;
  isSupported: boolean;
  recentVaultName: string | null;
  onOpenVault: () => void;
  onReopenRecent: () => void;
  onStartTemporary: () => void;
}

export const VaultWelcome: React.FC<VaultWelcomeProps> = ({
  isRestoring,
  isSupported,
  recentVaultName,
  onOpenVault,
  onReopenRecent,
  onStartTemporary,
}) => {
  if (isRestoring) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
        보관함을 확인하는 중...
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400">
          <FolderOpen className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-100 mb-2">보관함을 열어 시작하세요</h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          폴더 하나를 보관함으로 고르면 스캐폴드가 파일 하나씩 그 안에 놓입니다.
          <br />
          이후의 모든 변경은 따로 저장하지 않아도 자동으로 기록됩니다.
        </p>

        {isSupported ? (
          <div className="flex flex-col gap-2">
            {recentVaultName && (
              <button
                type="button"
                onClick={onReopenRecent}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span className="truncate">'{recentVaultName}' 다시 열기</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenVault}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                recentVaultName
                  ? 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>{recentVaultName ? '다른 폴더 열기' : '보관함 폴더 열기'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 text-left text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                이 브라우저는 폴더 접근을 지원하지 않습니다. Chrome 또는 Edge에서 열면 보관함을 쓸 수
                있습니다.
              </span>
            </p>
            <button
              type="button"
              onClick={onStartTemporary}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
            >
              저장 없이 임시로 사용하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
