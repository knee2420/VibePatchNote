import { Minus, Square, X } from 'lucide-react';
import type { WindowControlButtonsProps } from '../types';

/**
 * [Primitive] 데스크톱 IDE 윈도우 창 제어 버튼 부품.
 * 최소화(-), 최대화(□), 닫기(✕) 액션을 제공합니다.
 */
export function WindowControlButtons({
  onMinimize,
  onMaximize,
  onClose,
  className = '',
}: WindowControlButtonsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 윈도우 OS 버튼 (최소화, 최대화, 닫기) */}
      <button
        type="button"
        onClick={onMinimize}
        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
        title="최소화"
      >
        <Minus className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={onMaximize}
        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
        title="최대화"
      >
        <Square className="w-2.5 h-2.5" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="p-1 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded cursor-pointer"
        title="닫기"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
