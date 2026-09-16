import { memo } from 'react';
import type { NodeActionBarProps } from './types';

/**
 * NodeActionBar (노드 인라인 액션 바)
 *
 * 노드에 마우스를 올렸을 때 우측에 컴팩트하게 노출되는 인라인 파이프라인 트리거.
 * 예: Distill(합성 재실행), Auto-bind(자동 추천 바인딩), Unlink(연결 해제)
 */
export const NodeActionBar = memo(function NodeActionBar({
  actions,
  onTrigger,
  className = '',
  size = 'xs',
}: NodeActionBarProps) {
  if (!actions || actions.length === 0) return null;

  const isXs = size === 'xs';

  return (
    <div
      className={`flex items-center gap-0.5 p-0.5 rounded-md bg-white/95 border border-slate-200 shadow-2xs backdrop-blur-xs ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((act) => {
        const variantClass =
          act.variant === 'primary'
            ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
            : act.variant === 'danger'
              ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
              : act.variant === 'warning'
                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100';

        return (
          <button
            key={act.id}
            type="button"
            disabled={act.disabled}
            onClick={(e) => {
              e.stopPropagation();
              onTrigger(act.id, e);
            }}
            title={act.label}
            className={`
              rounded transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              ${isXs ? 'p-1' : 'p-1.5'}
              ${variantClass}
            `}
          >
            {act.icon}
          </button>
        );
      })}
    </div>
  );
});
