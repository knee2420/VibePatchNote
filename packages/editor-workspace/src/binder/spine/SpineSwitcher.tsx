import React, { memo } from 'react';
import type { SpineSwitcherProps } from './types';

/**
 * SpineSwitcher (루브릭 앵커 스위처)
 *
 * 바인더 트리의 부모-자식 위계를 결정하는 기준 척추(Perspective)를 전환하는 헤더 컨트롤.
 * 예: [Outline 중심] | [Wireframe 중심] | [Docs 중심] | [Segment 원자재]
 */
function SpineSwitcherInner<TMode extends string = string>({
  options,
  activeSpine,
  onChangeSpine,
  coverage,
  className = '',
  size = 'md',
}: SpineSwitcherProps<TMode>) {
  const isSm = size === 'sm';

  return (
    <div className={`flex flex-col gap-1.5 p-2 bg-slate-50/70 border-b border-slate-200 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Spine Perspective
        </span>
        {typeof coverage === 'number' && (
          <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Coverage {Math.round(coverage)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 overflow-x-auto no-scrollbar">
        {options.map((opt) => {
          const isActive = opt.id === activeSpine;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeSpine(opt.id)}
              title={opt.description || opt.label}
              className={`
                flex-1 flex items-center justify-center gap-1.5 rounded-md font-medium transition-all select-none whitespace-nowrap cursor-pointer
                ${isSm ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'}
                ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }
              `}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
              {opt.badge !== undefined && (
                <span
                  className={`
                    text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0
                    ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-slate-200 text-slate-600'}
                  `}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SpineSwitcher = memo(SpineSwitcherInner) as <TMode extends string = string>(
  props: SpineSwitcherProps<TMode>
) => React.ReactElement | null;
