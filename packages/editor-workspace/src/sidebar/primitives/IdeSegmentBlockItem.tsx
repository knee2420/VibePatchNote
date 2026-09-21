import { useState, type ReactNode, type MouseEvent } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Heading,
  Table as TableIcon,
  Image as ImageIcon,
  List as ListIcon,
  FileText,
  Boxes,
} from 'lucide-react';

export interface IdeSegmentBlockItemProps {
  id: string;
  blockIndex?: number;
  label: string;
  segmentType?: 'header' | 'table' | 'body' | 'image' | 'list' | 'meta' | string;
  pageNumber?: number;
  description?: string;
  isSelected?: boolean;
  isActive?: boolean;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  fieldCount?: number;
  boundFieldCount?: number;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // 1:N 복수 매핑 필드(IdeSegmentField 등) 수용 슬롯
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onToggleExpand?: (isExpanded: boolean) => void;
}

/** 세그먼트 유형별 아이콘 헬퍼 */
function renderSegmentIcon(type?: string) {
  switch (type) {
    case 'header':
      return <Heading className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case 'table':
      return <TableIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'list':
      return <ListIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'body':
      return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    default:
      return <Boxes className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  }
}

/**
 * IdeSegmentBlockItem
 * 캔버스 상의 시각적 물리 블록(제목 영역, 표 영역, 이미지 영역 등)을 표현하는 전용 카드.
 * Compound 패턴을 적용하여 children을 통해 하위에 1:N 복수 필드(IdeSegmentField)를 유연하게 수용합니다.
 */
export function IdeSegmentBlockItem({
  id: _id,
  blockIndex,
  label,
  segmentType = 'body',
  pageNumber,
  description,
  isSelected = false,
  isActive = false,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  fieldCount,
  boundFieldCount,
  badge,
  actions,
  children,
  className = '',
  onClick,
  onToggleExpand,
}: IdeSegmentBlockItemProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const next = !isExpanded;
    setInternalExpanded(next);
    onToggleExpand?.(next);
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border transition-all select-none overflow-hidden ${
        isSelected
          ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
          : isActive
          ? 'bg-slate-850 border-slate-700 shadow-xs'
          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850/60 hover:border-slate-700/80'
      } ${className}`}
    >
      {/* 1. 세그먼트 블록 헤더 바 */}
      <div className="flex items-center justify-between px-2.5 py-2 cursor-pointer group">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 하위 매핑 필드가 있는 경우 접기/펼치기 버튼 */}
          {children ? (
            <button
              type="button"
              aria-label={isExpanded ? '필드 접기' : '필드 펼치기'}
              onClick={handleToggleExpand}
              className="p-0.5 text-slate-500 hover:text-slate-200 rounded shrink-0 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </span>
          )}

          {/* 블록 유형 아이콘 */}
          {renderSegmentIcon(segmentType)}

          {/* 블록 번호 태그 & 라벨 */}
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {blockIndex !== undefined && (
              <span className="text-[10px] font-mono font-bold text-indigo-400/90 shrink-0">
                #{blockIndex}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-200 truncate">
              {label}
            </span>
            {pageNumber !== undefined && (
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                ({pageNumber}P)
              </span>
            )}
          </div>
        </div>

        {/* 헤더 우측 슬롯 (뱃지, 필드 수, 액션) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* 매핑 통계 태그 */}
          {fieldCount !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950/60 text-slate-400 border border-slate-800">
              {boundFieldCount !== undefined ? `${boundFieldCount}/` : ''}
              {fieldCount} slots
            </span>
          )}

          {badge}

          {actions && (
            <div className="hidden group-hover:flex items-center gap-1">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* 2. 블록 설명 (옵션) */}
      {description && (
        <div className="px-3 pb-1.5 text-[11px] text-slate-400 font-sans line-clamp-2">
          {description}
        </div>
      )}

      {/* 3. 하위 필드 컨테이너 (1:N 복수 매핑 슬롯) */}
      {children && isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-slate-800/40 bg-slate-950/20">
          {children}
        </div>
      )}
    </div>
  );
}
