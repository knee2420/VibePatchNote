import { memo, useState, useEffect } from 'react';
import { Hash, BookOpen, Layers, History, FileText } from 'lucide-react';
import type { ContextMentionMenuProps, MentionItem } from './types';

/**
 * ContextMentionMenu (안티그래비티 전역 @ 멘션 드롭다운)
 *
 * 프롬프트나 인풋에서 '@'를 입력했을 때 슬롯, 원본 문서, 세그먼트, 스냅샷을 추천하는 팝업.
 */
export const ContextMentionMenu = memo(function ContextMentionMenu({
  isOpen,
  query,
  items,
  onSelect,
  onClose,
  position,
  className = '',
}: ContextMentionMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.detail?.toLowerCase() || '').includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  const getCategoryIcon = (category: MentionItem['category']) => {
    switch (category) {
      case 'slot':
        return <Hash className="w-3 h-3 text-indigo-600 shrink-0" />;
      case 'doc':
        return <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'segment':
        return <Layers className="w-3 h-3 text-amber-600 shrink-0" />;
      case 'snapshot':
        return <History className="w-3 h-3 text-rose-600 shrink-0" />;
      case 'section':
      default:
        return <FileText className="w-3 h-3 text-blue-600 shrink-0" />;
    }
  };

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 120,
      }
    : {};

  return (
    <div
      style={style}
      className={`w-64 max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200/80 shadow-2xl ring-1 ring-black/5 p-1 text-xs no-scrollbar animate-in fade-in zoom-in-95 duration-100 ${className}`}
    >
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
        Workspace Context (@)
      </div>

      <div className="space-y-0.5 mt-1">
        {filteredItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`
                w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer select-none
                ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {item.icon || getCategoryIcon(item.category)}
                <span className="truncate">{item.label}</span>
              </div>

              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 uppercase ${
                  isSelected ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                }`}
              >
                {item.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
