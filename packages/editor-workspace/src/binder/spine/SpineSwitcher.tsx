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
    <div className={`flex flex-col gap-1.5 p-2 bg-slate-900/90 border-b border-slate-800 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
          Spine Perspective
        </span>
        {typeof coverage === 'number' && (
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Coverage {Math.round(coverage)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 p-0.5 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto no-scrollbar">
        {options.map((opt) => {
          const isActive = opt.id === activeSpine;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeSpine(opt.id)}
              title={opt.description || opt.label}
              className={`
                flex-1 flex items-center justify-center gap-1.5 rounded-md font-medium transition-all select-none whitespace-nowrap
                ${isSm ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'}
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
              {opt.badge !== undefined && (
                <span
                  className={`
                    text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0
                    ${isActive ? 'bg-indigo-800/80 text-indigo-100' : 'bg-slate-800 text-slate-400'}
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
