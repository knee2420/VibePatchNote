import type { ViewModeSwitchProps } from './types';

/**
 * 모던 다크 테마의 알약형(Pill) 세그먼트 뷰 모드 스위처 컴포넌트.
 * 에디터 캔버스 ⇄ 서식 규격 Matrix 등 여러 뷰 화면을 직관적으로 전환합니다.
 */
export function ViewModeSwitch<T extends string = string>({
  options,
  activeId,
  onChange,
  className = '',
}: ViewModeSwitchProps<T>) {
  return (
    <div
      className={`flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 select-none ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge && <span className="ml-1 shrink-0">{option.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
