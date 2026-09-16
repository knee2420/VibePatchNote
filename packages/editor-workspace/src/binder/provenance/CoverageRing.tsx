import { memo } from 'react';
import type { CoverageRingProps } from './types';

/**
 * CoverageRing (소화율 원형 링 게이지)
 *
 * 원본 근거 자료(세그먼트)가 규격 슬롯에 매핑된 비율을 SVG 원형 링으로 시각화합니다.
 */
export const CoverageRing = memo(function CoverageRing({
  value,
  size = 40,
  strokeWidth = 3.5,
  label,
  showPercent = true,
  className = '',
}: CoverageRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorClass =
    clamped >= 80
      ? 'text-emerald-600'
      : clamped >= 40
        ? 'text-indigo-600'
        : 'text-amber-600';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* 배경 트랙 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-slate-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* 진행도 링 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${colorClass} transition-all duration-500 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        {showPercent && (
          <span className="absolute text-[10px] font-bold font-mono text-slate-800">
            {Math.round(clamped)}%
          </span>
        )}
      </div>

      {label && (
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-medium text-slate-700 truncate">{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">
            {clamped >= 100 ? '전체 에셋 소화 완료' : `${Math.round(clamped)}% 반영`}
          </span>
        </div>
      )}
    </div>
  );
});
