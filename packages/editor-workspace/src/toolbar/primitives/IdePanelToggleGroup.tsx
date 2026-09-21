import { PanelLeft, PanelBottom, FolderKanban, PanelRight } from 'lucide-react';
import type { IdePanelToggleGroupProps } from '../types';

/**
 * [Primitive] IDE 4대 패널 토글 버튼 그룹 부품.
 * - 좌측 탐색기/바인더 토글 (`PanelLeft`)
 * - 하단 터미널/진단 토글 (`PanelBottom`)
 * - 리소스 매니저 패널 토글 (`FolderKanban`)
 * - 우측 AI 감사 패널 토글 (`PanelRight`)
 */
export function IdePanelToggleGroup({
  showPrimarySidebar = false,
  onTogglePrimarySidebar,
  showBottomPanel = false,
  onToggleBottomPanel,
  showResourceManager = false,
  onToggleResourceManager,
  showSecondarySidebar = false,
  onToggleSecondarySidebar,
  className = '',
}: IdePanelToggleGroupProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* 좌측 탐색기/바인더 패널 토글 */}
      {onTogglePrimarySidebar && (
        <button
          type="button"
          onClick={onTogglePrimarySidebar}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showPrimarySidebar
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="좌측 탐색기 패널 토글"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 하단 터미널/진단 패널 토글 */}
      {onToggleBottomPanel && (
        <button
          type="button"
          onClick={onToggleBottomPanel}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showBottomPanel
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="하단 터미널 패널 토글"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 리소스 매니저 패널 토글 */}
      {onToggleResourceManager && (
        <button
          type="button"
          onClick={onToggleResourceManager}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showResourceManager
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="리소스 매니저 패널 토글 (Ctrl+Shift+R)"
        >
          <FolderKanban className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 우측 보조 AI 패널 토글 */}
      {onToggleSecondarySidebar && (
        <button
          type="button"
          onClick={onToggleSecondarySidebar}
          className={`p-1 rounded transition-colors cursor-pointer ${
            showSecondarySidebar
              ? 'text-indigo-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="우측 AI 패널 토글"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
