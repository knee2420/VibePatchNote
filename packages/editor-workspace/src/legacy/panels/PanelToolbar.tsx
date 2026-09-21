import type { PanelToolbarProps } from './types';

/**
 * 패널 상단에 배치되는 컴팩트한 도구 모음(Toolbar) 컴포넌트.
 */
export function PanelToolbar({
  leftSlot,
  rightSlot,
  children,
  className = '',
}: PanelToolbarProps) {
  return (
    <div
      className={`h-9 px-3 flex items-center justify-between text-xs text-slate-300 gap-2 ${className}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        {leftSlot}
        {children}
      </div>
      {rightSlot && (
        <div className="flex items-center gap-1 shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
