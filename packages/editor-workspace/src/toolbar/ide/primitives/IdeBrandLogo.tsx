import { Sparkles } from 'lucide-react';
import type { IdeBrandLogoProps } from '../types';

/**
 * [Primitive] IDE 브랜드 로고 부품.
 * 기본값으로 AGY Sparkles 로고를 표시하며, 커스텀 아이콘 및 이름을 주입할 수 있습니다.
 */
export function IdeBrandLogo({
  icon,
  name = 'AGY',
  onClick,
  className = '',
}: IdeBrandLogoProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 mr-2 font-bold text-slate-100 select-none ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${className}`}
    >
      {icon !== undefined ? icon : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
      {name && <span className="text-[11px] tracking-wide">{name}</span>}
    </div>
  );
}
