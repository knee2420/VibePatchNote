import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { CorkboardCardItem } from './CorkboardCardItem';
import type { CorkboardViewProps } from './types';

/**
 * 스크리브너 스타일의 2D 코르크보드(Corkboard) 인덱스 카드 뷰.
 * 섹션 노드들을 카드로 펼쳐놓고 조감하며 드래그 앤 드롭으로 순서를 재배치할 수 있습니다.
 */
export function CorkboardView<T = Record<string, unknown>>({
  cards,
  selectedId,
  onSelect,
  onMove,
  onCardChange,
  renderCardFooter,
  columns,
  emptyText = '표시할 코르크보드 카드가 없습니다.',
  className = '',
}: CorkboardViewProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-8">
        <LayoutGrid className="w-8 h-8 stroke-[1.5] opacity-50 text-slate-600" />
        <p className="text-xs font-medium">{emptyText}</p>
      </div>
    );
  }

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (hoverIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== hoverIndex) {
      onMove?.(draggedIndex, hoverIndex);
    }
    setDraggedIndex(null);
  };

  const gridColsClass = columns
    ? `grid-cols-${columns}`
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`w-full h-full overflow-y-auto p-6 bg-slate-950/80 ${className}`}>
      <div className={`grid gap-4 ${gridColsClass}`}>
        {cards.map((card, index) => (
          <CorkboardCardItem<T>
            key={card.id}
            card={card}
            isSelected={card.id === selectedId}
            onSelect={() => onSelect?.(card)}
            onChange={onCardChange}
            renderFooter={renderCardFooter}
            onDragStart={onMove ? handleDragStart(index) : undefined}
            onDragOver={onMove ? handleDragOver : undefined}
            onDrop={onMove ? handleDrop(index) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
