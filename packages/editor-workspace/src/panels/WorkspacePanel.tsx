import { ChevronDown, ChevronRight } from 'lucide-react';
import type { WorkspacePanelProps } from './types';

/**
 * 워크스페이스 좌/우 고정 사이드바 및 인스펙터의 표준 프레임 패널.
 * 상단 헤더(제목, 액션 버튼, 접기 버튼), 패널 전용 툴바 슬롯, 스크롤 가능한 본문 영역을 제공합니다.
 */
export function WorkspacePanel({
  title,
  subtitle,
  actions,
  toolbar,
  children,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  bodyClassName = '',
}: WorkspacePanelProps) {
  return (
    <div className={`w-full h-full flex flex-col overflow-hidden select-none ${className}`}>
      {/* 1. 패널 상단 헤더 */}
      <div className="h-11 px-3.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {collapsible && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-slate-500 truncate -mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* 헤더 우측 액션 버튼 슬롯 */}
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>

      {/* 2. 패널 전용 가로 툴바 (옵션) */}
      {!isCollapsed && toolbar && (
        <div className="border-b border-slate-800/60 bg-slate-900/30 shrink-0">
          {toolbar}
        </div>
      )}

      {/* 3. 본문 콘텐츠 영역 */}
      {!isCollapsed && (
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}
