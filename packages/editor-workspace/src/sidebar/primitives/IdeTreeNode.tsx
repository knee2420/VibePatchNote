import React, { type ReactNode, type MouseEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export interface IdeTreeNodeProps {
  id: string;
  label: string;
  depth?: number;
  indentPx?: number;
  isFolder?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  disabled?: boolean;
  draggable?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onToggleExpand?: (e: MouseEvent<HTMLButtonElement>) => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * IdeTreeNode
 * react-arborist를 완전히 걷어낸 순수 React 경량 계층형 트리 노드 레고 블록.
 * 들여쓰기 가이드라인(level * indent), 접기/펼치기 화살표, 아이콘, 라벨, 활성 하이라이트, 호버 액션, 우클릭 지원.
 */
export function IdeTreeNode({
  label,
  depth = 0,
  indentPx = 14,
  isFolder = false,
  isExpanded = false,
  isSelected = false,
  isActive = false,
  icon,
  badge,
  subtitle,
  actions,
  disabled = false,
  draggable = false,
  className = '',
  onClick,
  onDoubleClick,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: IdeTreeNodeProps) {
  // 들여쓰기 가이드라인 세로선 배열 생성
  const guideLines = Array.from({ length: depth }, (_, i) => i);

  return (
    <div
      role="treeitem"
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-selected={isSelected}
      draggable={draggable && !disabled}
      onClick={disabled ? undefined : onClick}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      onDragStart={draggable && !disabled ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ paddingLeft: `${depth * indentPx + 8}px` }}
      className={`relative flex items-center justify-between pr-2 py-1 text-xs select-none transition-colors group cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-slate-500'
          : isSelected
          ? 'bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-400'
          : isActive
          ? 'bg-slate-800/80 text-slate-100 font-medium'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      } ${className}`}
    >
      {/* 들여쓰기 세로 가이드라인 (depth > 0 일 때 가이드선 표시) */}
      {guideLines.map((idx) => (
        <div
          key={idx}
          style={{ left: `${idx * indentPx + 14}px` }}
          className="absolute top-0 bottom-0 w-[1px] bg-slate-800/60 pointer-events-none group-hover:bg-slate-700/50"
        />
      ))}

      {/* 좌측 콘텐츠 (화살표 + 아이콘 + 라벨 + 서브타이틀) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* 접기/펼치기 화살표 버튼 또는 자리차지 스페이서 */}
        {isFolder ? (
          <button
            type="button"
            aria-label={isExpanded ? '접기' : '펼치기'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(e);
            }}
            className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-200 rounded shrink-0 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* 커스텀 아이콘 */}
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}

        {/* 라벨 및 서브타이틀 */}
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="truncate">{label}</span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* 우측 슬롯 (뱃지 + 호버 액션) */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* 상태 뱃지 (기본 노출) */}
        {badge && <span className="shrink-0">{badge}</span>}

        {/* 호버 액션 슬롯 (hover 시에만 노출되거나 항상 슬롯으로 전달된 것) */}
        {actions && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
