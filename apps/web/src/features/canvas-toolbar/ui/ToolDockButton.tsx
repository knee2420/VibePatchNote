import type { LucideIcon } from 'lucide-react';

interface ToolDockButtonProps {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  title: string;
  isActive?: boolean;
  /** 비활성 상태의 hover 색상 클래스. */
  hoverClass?: string;
  onClick?: () => void;
}

/** 좌측 툴 독의 아이콘 버튼 + 호버 툴팁 단위. */
export function ToolDockButton({
  icon: Icon,
  label,
  tooltip,
  title,
  isActive = false,
  hoverClass = 'hover:text-slate-900 hover:bg-slate-100',
  onClick,
}: ToolDockButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
        isActive ? 'bg-blue-600 text-white shadow-sm' : `text-slate-600 ${hoverClass}`
      }`}
      title={title}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
      <span className="sr-only">{label}</span>
      <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {tooltip}
      </span>
    </button>
  );
}
