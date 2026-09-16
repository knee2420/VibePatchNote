import { memo, useEffect } from 'react';
import { ArrowRight, CornerDownLeft } from 'lucide-react';
import type { GhostTextPredictorProps } from './types';

/**
 * GhostTextPredictor (안티그래비티 패시브 고스트 텍스트 & Tab Jump)
 *
 * 커서 위치 뒤에 연한 회색의 제안 텍스트를 오버레이로 렌더링하고,
 * Tab 키 입력 시 즉시 본문에 삽입하며 다음 슬롯으로의 점프 힌트를 제공합니다.
 */
export const GhostTextPredictor = memo(function GhostTextPredictor({
  ghostText,
  onAccept,
  onNextJump,
  jumpHint,
  className = '',
}: GhostTextPredictorProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        onAccept();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAccept]);

  if (!ghostText) return null;

  return (
    <span className={`inline font-sans text-slate-400 select-none ${className}`}>
      {/* 유령 텍스트 */}
      <span className="italic">{ghostText}</span>

      {/* Tab 키 힌트 뱃지 */}
      <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 select-none align-middle not-italic shadow-2xs">
        <kbd className="font-semibold">Tab</kbd>
        <CornerDownLeft className="w-2.5 h-2.5 text-slate-500" />
      </span>

      {/* 다음 슬롯 Tab to Jump 힌트 (있을 때) */}
      {jumpHint && (
        <button
          type="button"
          onClick={onNextJump}
          className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer select-none"
        >
          <span>{jumpHint}</span>
          <ArrowRight className="w-2 h-2" />
        </button>
      )}
    </span>
  );
});
