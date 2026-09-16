import React, { memo } from 'react';
import { FileText, Table, Image, Code, GripVertical } from 'lucide-react';
import type { StagingCardProps } from './types';

/**
 * StagingCard (미매핑 에셋 대기 카드)
 *
 * 원본 문서에서 추출되었으나 아직 바인더 규격 소켓에 꽂히지 않은 개별 에셋 카드.
 * 드래그하여 위의 소켓 노드로 직접 드롭할 수 있습니다.
 */
function StagingCardInner<T = Record<string, unknown>>({
  asset,
  onSelect,
  onDragStart,
  className = '',
}: StagingCardProps<T>) {
  const getIcon = () => {
    switch (asset.type) {
      case 'table':
        return <Table className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'image':
        return <Image className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'text':
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ id: asset.id, type: asset.type, title: asset.title })
    );
    e.dataTransfer.effectAllowed = 'copyMove';
    onDragStart?.(asset, e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect?.(asset)}
      className={`
        group relative flex flex-col gap-1 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/80
        shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none text-left
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
          {getIcon()}
          <span className="font-medium text-xs text-slate-200 truncate">{asset.title}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-800 text-slate-400 shrink-0">
          {asset.type}
        </span>
      </div>

      {asset.summary && (
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {asset.summary}
        </p>
      )}

      {/* 출처 태그 */}
      {asset.sourceDocTitle && (
        <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
          <span className="truncate max-w-[120px]">{asset.sourceDocTitle}</span>
          {asset.sourcePage !== undefined && <span>p.{asset.sourcePage}</span>}
        </div>
      )}
    </div>
  );
}

export const StagingCard = memo(StagingCardInner) as <T = Record<string, unknown>>(
  props: StagingCardProps<T>
) => React.ReactElement | null;
