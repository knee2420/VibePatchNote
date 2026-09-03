import { Check, type LucideIcon } from 'lucide-react';

interface SettingsToggleRowProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onToggle: () => void;
  /** 켜졌을 때 강조 색상 (기본: 파랑) */
  accent?: 'blue' | 'amber';
  activeIcon?: LucideIcon;
}

/** 설정 팝오버의 체크박스형 토글 한 줄. */
export function SettingsToggleRow({
  icon: Icon,
  label,
  checked,
  onToggle,
  accent = 'blue',
  activeIcon: ActiveIcon,
}: SettingsToggleRowProps) {
  const isAmber = accent === 'amber';
  const DisplayIcon = checked && ActiveIcon ? ActiveIcon : Icon;

  return (
    <button
      onClick={onToggle}
      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between group transition-colors ${
        isAmber && checked ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-700 hover:bg-blue-50/80'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <DisplayIcon
          className={`w-4 h-4 transition-colors ${
            isAmber && checked
              ? 'text-amber-600'
              : 'text-slate-400 group-hover:text-blue-600'
          }`}
        />
        <span>{label}</span>
      </div>
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked
            ? isAmber
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-blue-600 border-blue-600 text-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
    </button>
  );
}
