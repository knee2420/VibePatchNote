import type { WordCountBadgeProps } from './types';

/**
 * 실시간 문서 글자 수 / 단어 수 및 목표 진행률 배지 컴포넌트.
 */
export function WordCountBadge({
  charCount,
  wordCount,
  targetCount,
  className = '',
}: WordCountBadgeProps) {
  const percent = targetCount
    ? Math.min(100, Math.round((charCount / targetCount) * 100))
    : null;

  return (
    <div
      className={`flex items-center gap-2 text-[11px] font-mono text-slate-400 select-none ${className}`}
      title={`글자 수: ${charCount.toLocaleString()}자 ${
        wordCount !== undefined ? `| 단어 수: ${wordCount.toLocaleString()}단어` : ''
      }`}
    >
      <span>
        <strong className="text-slate-200">{charCount.toLocaleString()}</strong>자
      </span>

      {wordCount !== undefined && (
        <span className="text-slate-500">
          (<strong className="text-slate-300">{wordCount.toLocaleString()}</strong> 단어)
        </span>
      )}

      {percent !== null && (
        <span className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[10px]">
          {percent}%
        </span>
      )}
    </div>
  );
}
