import React, { type ReactNode, type MouseEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export interface IdeTreeRowProps {
  id: string;
  depth?: number;
  indentPx?: number;
  isFolder?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  // 슬롯 기반 레고 블록 구성요소
  leading?: ReactNode;      // 아이콘, 레벨 태그, 블록 유형 뱃지
  primary: ReactNode;       // 주 타이틀 / 라벨
  secondary?: ReactNode;     // 서브타이틀, 설명
  trailing?: ReactNode;      // 페이지 번호, 슬롯 카운트, 상태 배지
  actions?: ReactNode;       // 호버 시 노출되는 빠른 액션 버튼 그룹
  accessories?: ReactNode;   // 행 하단에 인라인으로 부착되는 부속 컴포넌트 (예: N개 필드 소켓)
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
 * IdeTreeRow
 * 좌측 패널의 모든 계층 행(Row)을 구성하는 범용 조립 뼈대.
 * 목차 노드, 세그먼트 블록 노드, 와이어 슬롯 노드 모두 이 단일 부품에 슬롯을 꽂아 조립합니다.
 */
export function IdeTreeRow({
  depth = 0,
  indentPx = 14,
  isFolder = false,
  isExpanded = false,
  isSelected = false,
  isActive = false,
  disabled = false,
  draggable = false,
  leading,
  primary,
  secondary,
  trailing,
  actions,
  accessories,
  className = '',
  onClick,
  onDoubleClick,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: IdeTreeRowProps) {
  // 들여쓰기 세로 가이드라인 배열
  const guideLines = Array.from({ length: depth }, (_, i) => i);

  return (
    <div className="flex flex-col select-none group/row">
      {/* 1. 메인 행 (Row) */}
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
        className={`relative flex items-center justify-between pr-2.5 py-1 text-xs transition-colors cursor-pointer ${
          disabled
            ? 'opacity-40 cursor-not-allowed text-slate-500'
            : isSelected
            ? 'bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-400'
            : isActive
            ? 'bg-slate-800/80 text-slate-100 font-medium'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        } ${className}`}
      >
        {/* 들여쓰기 세로 가이드라인 */}
        {guideLines.map((idx) => (
          <div
            key={idx}
            style={{ left: `${idx * indentPx + 14}px` }}
            className="absolute top-0 bottom-0 w-[1px] bg-slate-800/60 pointer-events-none group-hover/row:bg-slate-700/50"
          />
        ))}

        {/* 좌측 슬롯 (Chevron + Leading + Primary + Secondary) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* 폴더 접기/펼치기 화살표 */}
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

          {/* Leading 슬롯 (아이콘, 레벨 태그, 블록 유형 등) */}
          {leading && <span className="shrink-0 flex items-center">{leading}</span>}

          {/* 라벨 및 서브 라벨 */}
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="truncate">{primary}</span>
            {secondary && (
              <span className="text-[10px] text-slate-500 truncate shrink-0">
                {secondary}
              </span>
            )}
          </div>
        </div>

        {/* 우측 슬롯 (Trailing 메타데이터 + 호버 액션) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {trailing && <span className="shrink-0">{trailing}</span>}

          {actions && (
            <div className="hidden group-hover/row:flex items-center gap-0.5 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* 2. Accessories 슬롯 (행 바로 아래에 인라인으로 부착되는 하위 부속 콘텐츠) */}
      {accessories && (
        <div
          style={{ paddingLeft: `${(depth + 1) * indentPx + 12}px` }}
          className="pr-2 py-1"
        >
          {accessories}
        </div>
      )}
    </div>
  );
}
