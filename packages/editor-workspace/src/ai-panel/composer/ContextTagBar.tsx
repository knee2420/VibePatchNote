import { memo } from 'react';
import { X, Plus, FileText, Hash, BookOpen, Layers } from 'lucide-react';
import type { ContextTagBarProps, ContextTagItem } from './types';

/**
 * ContextTagBar (컨텍스트 하네스 태그 바)
 *
 * 현재 선택된 문서 섹션(@Section 3), 바인더 슬롯(@Slot #1), 원본 리소스(@Doc A)를
 * 프롬프트에 동적으로 바인딩하여 칩 형태로 보여줍니다.
 */
export const ContextTagBar = memo(function ContextTagBar({
  tags,
  onRemoveTag,
  onAddTagClick,
  className = '',
}: ContextTagBarProps) {
  const getTagIcon = (tag: ContextTagItem) => {
    if (tag.icon) return tag.icon;
    switch (tag.type) {
      case 'slot':
        return <Hash className="w-2.5 h-2.5 text-indigo-400 shrink-0" />;
      case 'doc':
        return <BookOpen className="w-2.5 h-2.5 text-emerald-400 shrink-0" />;
      case 'segment':
        return <Layers className="w-2.5 h-2.5 text-amber-400 shrink-0" />;
      case 'section':
      default:
        return <FileText className="w-2.5 h-2.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700 select-none shadow-2xs group"
          title={tag.detail || tag.label}
        >
          {getTagIcon(tag)}
          <span className="truncate max-w-[120px] font-medium">{tag.label}</span>
          {onRemoveTag && (
            <button
              type="button"
              onClick={() => onRemoveTag(tag.id)}
              className="p-0.2 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}

      {onAddTagClick && (
        <button
          type="button"
          onClick={onAddTagClick}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer select-none"
        >
          <Plus className="w-2.5 h-2.5 text-slate-500" />
          <span>컨텍스트 추가</span>
        </button>
      )}
    </div>
  );
});
