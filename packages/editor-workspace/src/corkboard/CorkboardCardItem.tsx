import { useState } from 'react';
import { FileText, GripVertical } from 'lucide-react';
import type { CorkboardCard } from './types';

interface CorkboardCardItemProps<T> {
  card: CorkboardCard<T>;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (updated: CorkboardCard<T>) => void;
  renderFooter?: (card: CorkboardCard<T>) => React.ReactNode;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function CorkboardCardItem<T>({
  card,
  isSelected = false,
  onSelect,
  onChange,
  renderFooter,
  onDragStart,
  onDragOver,
  onDrop,
}: CorkboardCardItemProps<T>) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [synopsis, setSynopsis] = useState(card.synopsis || '');

  const labelColor = card.labelColor || '#a855f7';

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== card.title) {
      onChange?.({ ...card, title });
    }
  };

  const handleSynopsisBlur = () => {
    if (synopsis !== card.synopsis) {
      onChange?.({ ...card, synopsis });
    }
  };

  return (
    <div
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`group relative flex flex-col h-56 rounded-xl border bg-white shadow-2xs transition-all select-none cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* 1. 상단 라벨 컬러 띠 */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: labelColor }}
      />

      {/* 2. 카드 헤더 (드래그 핸들, 제목, 아이콘) */}
      <div className="p-3 pb-2 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="w-3 h-3" />
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-900 outline-none"
            />
          ) : (
            <h4
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="text-xs font-bold text-slate-800 truncate hover:text-indigo-600 transition-colors"
              title="더블 클릭하여 제목 변경"
            >
              {card.title}
            </h4>
          )}
        </div>

        <div className="text-slate-400 group-hover:text-slate-600 cursor-grab shrink-0">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3. 본문 시놉시스/요약 영역 */}
      <div className="p-3 flex-1 overflow-hidden">
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          onBlur={handleSynopsisBlur}
          onClick={(e) => e.stopPropagation()}
          placeholder="이 섹션의 핵심 요약이나 저작 메모를 입력하세요..."
          className="w-full h-full bg-transparent resize-none text-[11px] leading-relaxed text-slate-600 placeholder-slate-400 outline-none border-0 focus:ring-0 font-sans"
        />
      </div>

      {/* 4. 카드 하단 메타/푸터 */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-mono truncate max-w-[120px]" title={card.id}>
          {card.id}
        </span>

        {renderFooter ? (
          renderFooter(card)
        ) : card.status ? (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200/60">
            {card.status}
          </span>
        ) : null}
      </div>
    </div>
  );
}
