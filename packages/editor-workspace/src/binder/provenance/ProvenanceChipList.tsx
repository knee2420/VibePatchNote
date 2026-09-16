import { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { ProvenanceChipListProps } from './types';

/**
 * ProvenanceChipList (역추적 출처 칩 목록)
 *
 * 노드 우측에 연결된 원천 출처 칩(예: [Doc A: p.3], [Doc B: p.12])을 렌더링하며,
 * 클릭 시 중앙 패널의 원본 뷰어 해당 위치로 점프하는 콜백을 발생시킵니다.
 */
export const ProvenanceChipList = memo(function ProvenanceChipList({
  items,
  onSelect,
  maxVisible = 2,
  className = '',
}: ProvenanceChipListProps) {
  if (!items || items.length === 0) return null;

  const visible = items.slice(0, maxVisible);
  const remainder = items.length - maxVisible;

  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      {visible.map((item) => {
        const title = item.sourceDocTitle || 'Doc';
        const page = item.page !== undefined ? `p.${item.page}` : '';
        const chipText = [title, page].filter(Boolean).join(' ');

        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(item);
            }}
            title={`출처 점프: ${item.sourceDocTitle || ''} (Page ${item.page || 1})`}
            className="group flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-[10px] font-mono text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[80px]">{chipText}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 shrink-0 text-indigo-600" />
          </button>
        );
      })}

      {remainder > 0 && (
        <span
          className="text-[9px] px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono"
          title={`추가 출처 ${remainder}개`}
        >
          +{remainder}
        </span>
      )}
    </div>
  );
});
