import type { IdeActivityBarActionProps } from '../types';

/**
 * [Primitive] 액티비티 바 하단 유틸리티 액션 버튼 부품 (계정, 설정 등 Stateless Action Trigger).
 */
export function IdeActivityBarAction({
  icon,
  title,
  badge,
  onClick,
  className = '',
}: IdeActivityBarActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-9 flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer select-none transition-colors ${className}`}
      title={title}
    >
      {icon}
      {badge !== undefined && (
        <span className="absolute bottom-1 right-1.5 min-w-[12px] h-3 px-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none">
          {badge}
        </span>
      )}
    </button>
  );
}
