import { ChevronRight } from 'lucide-react';
import type { BreadcrumbBarProps } from './types';

/**
 * 워크스페이스 상태바 또는 상단에 배치되는 바인더 계층 브레드크럼 네비게이터.
 */
export function BreadcrumbBar({
  items,
  onSelect,
  className = '',
}: BreadcrumbBarProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-[11px] text-slate-500 select-none overflow-hidden ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            )}
            <button
              type="button"
              disabled={isLast || !onSelect}
              onClick={() => onSelect?.(item)}
              className={`flex items-center gap-1 truncate transition-colors ${
                isLast
                  ? 'text-slate-800 font-semibold cursor-default'
                  : 'text-slate-500 hover:text-blue-600 cursor-pointer'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
