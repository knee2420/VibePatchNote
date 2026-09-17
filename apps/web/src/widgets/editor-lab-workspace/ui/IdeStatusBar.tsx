import {
  GitBranch,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Bell,
  Code,
} from 'lucide-react';

interface IdeStatusBarProps {
  cursorLine: number;
  cursorCol: number;
  branchName?: string;
  language?: string;
  syncState?: string;
}

export function IdeStatusBar({
  cursorLine = 19,
  cursorCol = 1,
  branchName = 'add-document-editor*',
  language = 'TypeScript JSX',
  syncState = 'idle',
}: IdeStatusBarProps) {
  return (
    <footer className="h-6 bg-slate-950 border-t border-slate-850 flex items-center justify-between px-3 text-[11px] text-slate-400 select-none shrink-0 z-30 font-sans">
      {/* 1. 좌측 워크스페이스 컨텍스트 */}
      <div className="flex items-center gap-3">
        {/* Git 브랜치 */}
        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer"
          title="Checkout Branch"
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[10px]">{branchName}</span>
        </button>

        {/* 동기화 아이콘 */}
        <button
          type="button"
          className="hover:text-slate-200 cursor-pointer"
          title="Synchronize Changes"
        >
          <RefreshCw className="w-3 h-3 text-slate-500 hover:text-slate-300" />
        </button>

        {/* 진단 에러/경고 */}
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-500" />
            0
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-slate-500" />
            0
          </span>
        </div>
      </div>

      {/* 2. 우측 파일/에디터 메타데이터 */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
        <span className="hover:text-slate-200 cursor-pointer">
          Ln {cursorLine}, Col {cursorCol}
        </span>
        <span className="hover:text-slate-200 cursor-pointer">
          Spaces: 2
        </span>
        <span className="hover:text-slate-200 cursor-pointer">
          UTF-8
        </span>
        <span className="hover:text-slate-200 cursor-pointer">
          LF
        </span>
        <span className="hover:text-slate-200 cursor-pointer flex items-center gap-1 font-sans">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              syncState === 'saving'
                ? 'bg-amber-400 animate-pulse'
                : syncState === 'saved'
                ? 'bg-emerald-400'
                : syncState === 'error'
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`}
          />
          <span>{syncState === 'saving' ? 'Syncing...' : syncState === 'saved' ? 'Synced' : 'SSOT'}</span>
        </span>
        <span className="hover:text-slate-200 cursor-pointer flex items-center gap-1 font-sans">
          <Code className="w-3 h-3 text-blue-400" />
          {language}
        </span>
        <span className="hover:text-slate-200 cursor-pointer font-sans text-indigo-300 font-medium">
          Antigravity - Settings
        </span>
        <button
          type="button"
          className="hover:text-slate-200 cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3 h-3 text-slate-500 hover:text-slate-300" />
        </button>
      </div>
    </footer>
  );
}
