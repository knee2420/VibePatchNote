import { useState, useEffect } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react';

import type { BinderItem } from './types';

/**
 * 스크리브너/IDE 스타일의 바인더 트리 기본 노드 렌더러.
 */
export function BinderNode<T>({
  node,
  style,
  dragHandle,
}: NodeRendererProps<BinderItem<T>>) {
  const isFolder = Boolean(node.data.isFolder || node.children);
  const [editValue, setEditValue] = useState(node.data.name);

  useEffect(() => {
    setEditValue(node.data.name);
  }, [node.data.name]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      node.submit(editValue);
    } else if (e.key === 'Escape') {
      node.reset();
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      onClick={() => node.select()}
      className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer select-none transition-colors ${
        node.isSelected
          ? 'bg-purple-600/30 text-purple-200 font-semibold'
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
      } ${node.state.isDragging ? 'opacity-50' : ''}`}
    >
      {/* 1. 폴더 화살표 토글 버튼 */}
      {isFolder ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
          className="p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          {node.isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}

      {/* 2. 아이콘 (폴더 vs 문서) */}
      <span className="shrink-0 text-slate-400 group-hover:text-slate-200">
        {isFolder ? (
          node.isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400" />
          )
        ) : (
          <FileText className="w-3.5 h-3.5 text-purple-400" />
        )}
      </span>

      {/* 3. 라벨 또는 인라인 이름 편집창 */}
      <div className="flex-1 min-w-0 truncate">
        {node.isEditing ? (
          <input
            type="text"
            value={editValue}
            autoFocus
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => node.submit(editValue)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
          />
        ) : (
          <span className="truncate" onDoubleClick={() => node.edit()}>
            {node.data.name}
          </span>
        )}
      </div>
    </div>
  );
}
