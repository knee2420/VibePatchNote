import { useState, type ReactNode, type MouseEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export interface IdeSidebarSectionProps {
  id?: string;
  title: string;
  countBadge?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (isCollapsed: boolean) => void;
  children: ReactNode;
  className?: string;
}

/**
 * IdeSidebarSection
 * 사이드바 내부에서 독립적인 관심사(목차, 블록, 슬롯, 익스플로러 등)를 아코디언 형태로 담아내는 공통 프레임.
 * 한 사이드바 패널 안에 여러 개를 수직으로 적층할 수 있습니다.
 */
export function IdeSidebarSection({
  id: _id,
  title,
  countBadge,
  icon,
  actions,
  defaultCollapsed = false,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  children,
  className = '',
}: IdeSidebarSectionProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const next = !isCollapsed;
    setInternalCollapsed(next);
    onToggleCollapse?.(next);
  };

  return (
    <div className={`border-b border-slate-800/60 flex flex-col shrink-0 select-none ${className}`}>
      {/* 섹션 헤더 바 */}
      <div
        onClick={handleToggle}
        className="flex items-center justify-between px-2.5 py-1.5 bg-slate-925/60 hover:bg-slate-800/40 text-slate-300 cursor-pointer group/section transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-slate-500 group-hover/section:text-slate-300 transition-colors">
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>

          {icon && <span className="shrink-0 text-slate-400">{icon}</span>}

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 truncate">
            {title}
          </span>

          {countBadge && (
            <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
              {countBadge}
            </span>
          )}
        </div>

        {actions && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="hidden group-hover/section:flex items-center gap-1 shrink-0 text-slate-400"
          >
            {actions}
          </div>
        )}
      </div>

      {/* 섹션 본문 */}
      {!isCollapsed && <div className="flex flex-col">{children}</div>}
    </div>
  );
}
