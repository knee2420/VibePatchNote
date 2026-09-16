import { useState } from 'react';
import { Search, X, FilePlus, FolderPlus, ChevronsDownUp } from 'lucide-react';
import type { BinderToolbarProps } from './types';

/**
 * 바인더 트리 상단에 위치하여 검색 필터링 및 노드 추가/접기 작업을 수행하는 전용 툴바.
 */
export function BinderToolbar({
  searchTerm = '',
  onSearchChange,
  onAddDocument,
  onAddFolder,
  onCollapseAll,
  showSearch = true,
  extraActions,
  className = '',
}: BinderToolbarProps) {
  const [isSearching, setIsSearching] = useState(Boolean(searchTerm));

  return (
    <div
      className={`px-3 py-1.5 flex flex-col gap-1.5 border-b border-slate-200 bg-white select-none ${className}`}
    >
      {/* 1. 상단 액션 버튼 행 */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {onAddDocument && (
            <button
              type="button"
              onClick={onAddDocument}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="새 문서 추가"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          )}

          {onAddFolder && (
            <button
              type="button"
              onClick={onAddFolder}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="새 폴더 추가"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            </button>
          )}

          {onCollapseAll && (
            <button
              type="button"
              onClick={onCollapseAll}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="모두 접기"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {extraActions}

          {showSearch && onSearchChange && (
            <button
              type="button"
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) {
                  onSearchChange('');
                }
              }}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isSearching
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="검색창 열기/닫기"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 검색 인풋창 (토글 시 표시) */}
      {showSearch && isSearching && onSearchChange && (
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="바인더 노드 검색..."
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-6 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
