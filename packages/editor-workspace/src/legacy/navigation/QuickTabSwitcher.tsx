import { useKeyboardTabSwitch } from './useKeyboardTabSwitch';
import type { QuickTabSwitcherProps } from './types';

/**
 * 키보드 단축키(Ctrl+1~9) 힌트와 부드러운 전환 트랜지션을 지원하는 고속 패널 탭 스위처.
 */
export function QuickTabSwitcher({
  tabs,
  activeId,
  onChange,
  showShortcutHints = true,
  size = 'md',
  className = '',
}: QuickTabSwitcherProps) {
  // 키보드 단축키 자동 바인딩
  useKeyboardTabSwitch(tabs, activeId, onChange);

  const sizeClasses = {
    sm: 'py-1 px-2 text-[11px] gap-1',
    md: 'py-1.5 px-3 text-xs gap-1.5',
    lg: 'py-2 px-4 text-sm gap-2',
  }[size];

  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 select-none ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const shortcutNum = index + 1 <= 9 ? `Ctrl+${index + 1}` : undefined;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            title={shortcutNum ? `${tab.label} (${shortcutNum})` : tab.label}
            className={`flex items-center font-medium rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${
              isActive
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge && <span className="ml-1 shrink-0">{tab.badge}</span>}

            {showShortcutHints && index < 9 && (
              <kbd
                className={`ml-1 text-[9px] font-mono px-1 rounded transition-colors hidden sm:inline-block ${
                  isActive
                    ? 'bg-slate-100 text-slate-500 border border-slate-200/60'
                    : 'bg-slate-200/60 text-slate-400'
                }`}
              >
                ^{index + 1}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
