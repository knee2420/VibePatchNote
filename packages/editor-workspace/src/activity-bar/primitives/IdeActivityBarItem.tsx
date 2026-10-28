import type { IdeActivityBarItemProps } from '../types';

/**
 * [Primitive] 액티비티 바 개별 탭 아이콘 버튼 부품.
 * - side: 'left' | 'right' (인디케이터 방향)
 * - variant: 'line' (VS Code 클래식 라인) | 'rounded' (모던 하이라이트 박스)
 * - 뱃지: 숫자/텍스트 카운트 및 'dot' 펄스 배지 지원
 */
export function IdeActivityBarItem({
  icon,
  label,
  isActive = false,
  side = 'left',
  variant = 'line',
  badge,
  onClick,
  className = '',
}: IdeActivityBarItemProps) {
  if (variant === 'rounded') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center select-none ${
          isActive
            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs'
            : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
        } ${className}`}
        title={label}
      >
        {icon}
        {badge === 'dot' ? (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        ) : badge !== undefined && badge !== null ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </button>
    );
  }

  // 기본 variant: 'line'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-10 flex items-center justify-center transition-colors cursor-pointer group select-none ${
        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      } ${className}`}
      title={label}
    >
      {/* 활성 인디케이터 바 (좌/우 방향) */}
      {isActive && (
        <div
          className={`absolute top-1.5 bottom-1.5 w-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] ${
            side === 'right' ? 'right-0 rounded-l' : 'left-0 rounded-r'
          }`}
        />
      )}

      {/* 아이콘 */}
      {icon}

      {/* 배지 카운트 */}
      {badge === 'dot' ? (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      ) : badge !== undefined && badge !== null ? (
        <span className="absolute bottom-1.5 right-1.5 px-1 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold font-mono">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
