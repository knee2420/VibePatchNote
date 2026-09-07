import React, { useState, useMemo, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Folder,
  FolderOpen,
  Table2,
  KeyRound,
  ListOrdered,
  FileText,
  Image,
  Paperclip,
  Search,
  RotateCw,
  X,
} from 'lucide-react';

import type { DocumentElementItem, DocumentOutlineNode } from '../model/types';

interface DocumentOutlinePanelProps {
  title: string;
  outlines: DocumentOutlineNode[];
  selectedElementId?: string | null;
  isRefreshing?: boolean;
  onSelectElement?: (element: DocumentElementItem) => void;
  onClose: () => void;
  onRefresh?: () => void;
}

const ELEMENT_ICON_MAP: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  table: { icon: Table2, color: 'text-indigo-500' },
  form_field: { icon: KeyRound, color: 'text-emerald-500' },
  list: { icon: ListOrdered, color: 'text-amber-500' },
  paragraph: { icon: FileText, color: 'text-blue-500' },
  media: { icon: Image, color: 'text-rose-500' },
};

export const DocumentOutlinePanel = memo(function DocumentOutlinePanel({
  title,
  outlines,
  selectedElementId,
  isRefreshing = false,
  onSelectElement,
  onClose,
  onRefresh,
}: DocumentOutlinePanelProps) {
  const [filterText, setFilterText] = useState('');

  // 모든 노드 ID 목록 수집
  const allNodeIds = useMemo(() => {
    const ids: string[] = [];
    function collect(nodes: DocumentOutlineNode[]) {
      for (const n of nodes) {
        ids.push(n.id);
        if (n.children) collect(n.children);
      }
    }
    collect(outlines);
    return ids;
  }, [outlines]);

  // 중앙 집중식 접기/펼치기 상태 관리 (VSCode Tree Manager)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allNodeIds));

  const handleExpandAll = () => {
    setExpandedIds(new Set(allNodeIds));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleToggleNode = (nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 검색 필터링 적용 (제목 또는 엘리먼트 라벨 매칭)
  const filteredOutlines = useMemo(() => {
    if (!filterText.trim()) return outlines;
    const query = filterText.toLowerCase();

    function filterNode(node: DocumentOutlineNode): DocumentOutlineNode | null {
      const matchTitle = node.title.toLowerCase().includes(query);
      const matchedElements = node.elements.filter((e) =>
        e.label.toLowerCase().includes(query) || (e.content_summary?.toLowerCase() || '').includes(query)
      );
      const matchedChildren = node.children
        .map(filterNode)
        .filter((c): c is DocumentOutlineNode => c !== null);

      if (matchTitle || matchedElements.length > 0 || matchedChildren.length > 0) {
        return {
          ...node,
          elements: matchTitle ? node.elements : matchedElements,
          children: matchedChildren,
        };
      }
      return null;
    }

    return outlines.map(filterNode).filter((n): n is DocumentOutlineNode => n !== null);
  }, [outlines, filterText]);

  return (
    <div className="w-[340px] h-full flex flex-col border-l border-slate-200 bg-white dark:bg-slate-900 select-none text-slate-700 dark:text-slate-300 text-xs shrink-0 overflow-hidden nodrag">
      {/* 1. VSCode 스타일 상단 툴바 */}
      <div className="h-9 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold tracking-wider uppercase text-[10px] text-slate-500 dark:text-slate-400 truncate">
            OUTLINE
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            ({outlines.length})
          </span>
        </div>

        <div className="flex items-center gap-0.5 text-slate-400">
          <button
            onClick={handleExpandAll}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="모두 펼치기 (Expand All)"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCollapseAll}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="모두 접기 (Collapse All)"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="아웃라인 다시 추출 (새로고침)"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            title="패널 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 검색/필터 인풋 (VSCode 파일 트리 필터) */}
      <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-transparent focus-within:border-indigo-400 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
          <Search className="w-3 h-3 text-slate-400 shrink-0" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="아웃라인 및 엘리먼트 필터..."
            className="w-full bg-transparent outline-none text-[11px] placeholder:text-slate-400"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 파일 디렉토리 트리 본문 (VSCode / Obsidian Tree View) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {filteredOutlines.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-[11px]">
            {filterText ? '일치하는 항목이 없습니다.' : '아웃라인 데이터가 없습니다.'}
          </div>
        ) : (
          filteredOutlines.map((node) => (
            <TreeOutlineNode
              key={node.id}
              node={node}
              depth={0}
              expandedIds={expandedIds}
              onToggleNode={handleToggleNode}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
            />
          ))
        )}
      </div>

      {/* 4. 상태바 푸터 */}
      <div className="h-6 px-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 flex items-center justify-between shrink-0 font-mono">
        <span className="truncate" title={title}>{title}</span>
        <span className="shrink-0">{outlines.length} sections</span>
      </div>
    </div>
  );
});

interface TreeOutlineNodeProps {
  node: DocumentOutlineNode;
  depth: number;
  expandedIds: Set<string>;
  onToggleNode: (id: string) => void;
  selectedElementId?: string | null;
  onSelectElement?: (element: DocumentElementItem) => void;
}

function TreeOutlineNode({
  node,
  depth,
  expandedIds,
  onToggleNode,
  selectedElementId,
  onSelectElement,
}: TreeOutlineNodeProps) {
  const isOpen = expandedIds.has(node.id);

  const hasChildren =
    (node.children && node.children.length > 0) || (node.elements && node.elements.length > 0);

  const indentPx = depth * 14 + 6;

  return (
    <div className="w-full">
      {/* 폴더(Outline Section) 행 */}
      <div
        onClick={() => onToggleNode(node.id)}
        style={{ paddingLeft: `${indentPx}px` }}
        className="h-6.5 pr-2 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row text-slate-700 dark:text-slate-200"
        title={`${node.title} ${node.purpose ? `\n- 목적: ${node.purpose}` : ''}`}
      >
        {/* Chevron 토글 */}
        <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-slate-400 group-hover/row:text-slate-600 dark:group-hover/row:text-slate-300">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : (
            <span className="w-3 h-3" />
          )}
        </span>

        {/* 폴더 아이콘 */}
        <span className="shrink-0 text-amber-500/90 dark:text-amber-400">
          {isOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
        </span>

        {/* 섹션 제목 */}
        <span className="flex-1 truncate font-medium text-[11px] leading-none">
          {node.title}
        </span>

        {/* 페이지 뱃지 (VSCode git status 느낌의 은은한 우측 뱃지) */}
        {node.page && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 group-hover/row:text-slate-600 dark:group-hover/row:text-slate-400">
            p.{node.page}
          </span>
        )}
      </div>

      {/* 펼쳐졌을 때: 들여쓰기 가이드라인과 함께 자식 노드 & 엘리먼트 렌더링 */}
      {isOpen && hasChildren && (
        <div className="relative">
          {/* 들여쓰기 수직 가이드라인 */}
          <div
            style={{ left: `${indentPx + 6}px` }}
            className="absolute top-0 bottom-1 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none"
          />

          {/* 1. 소속 엘리먼트(컴포넌트) 파일 행들 */}
          {node.elements &&
            node.elements.map((elem) => (
              <TreeElementItem
                key={elem.id}
                element={elem}
                depth={depth + 1}
                isSelected={selectedElementId === elem.id}
                onClick={() => onSelectElement?.(elem)}
              />
            ))}

          {/* 2. 자식 아웃라인(하위 폴더) 노드들 */}
          {node.children &&
            node.children.map((child) => (
              <TreeOutlineNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggleNode={onToggleNode}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface TreeElementItemProps {
  element: DocumentElementItem;
  depth: number;
  isSelected: boolean;
  onClick: () => void;
}

function TreeElementItem({
  element,
  depth,
  isSelected,
  onClick,
}: TreeElementItemProps) {
  const iconConfig = ELEMENT_ICON_MAP[element.type] || {
    icon: Paperclip,
    color: 'text-slate-400',
  };
  const IconComponent = iconConfig.icon;
  const indentPx = depth * 14 + 6;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ paddingLeft: `${indentPx}px` }}
      className={`
        h-6.5 pr-2 flex items-center gap-1.5 cursor-pointer transition-colors group/item relative
        ${
          isSelected
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
        }
      `}
      title={`${element.label} (${element.type}) - 클릭하여 문서 위치로 이동`}
    >
      {/* 선택 시 좌측 VSCode Active Bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-600 dark:bg-indigo-400" />
      )}

      {/* 파일 아이콘 (Chevron 자리 대체 들여쓰기) */}
      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover/item:bg-slate-400" />
      </span>

      <span className={`shrink-0 ${iconConfig.color}`}>
        <IconComponent className="w-3.5 h-3.5" />
      </span>

      {/* 엘리먼트 라벨 */}
      <span className="flex-1 truncate text-[11px] leading-none">
        {element.label}
      </span>

      {/* 페이지 번호 */}
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-400">
        p.{element.page}
      </span>
    </div>
  );
}
