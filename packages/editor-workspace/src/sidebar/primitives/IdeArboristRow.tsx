import { useState } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderTree,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading,
  Table as TableIcon,
  Image as ImageIcon,
  List as ListIcon,
  Boxes,
  CheckCircle2,
  Sparkles,
  CircleDot,
  Hash,
  X,
  Check,
} from 'lucide-react';
import { useIdeArboristContext } from '../IdeArboristContext';
import type { IdeArboristNodeData } from '../types';

export interface IdeArboristRowCustomProps {
  onSelectSlot?: (slotId: string, pageNumber: number) => void;
  onApplySuggested?: (slotId: string) => void;
  onUnbindSlot?: (slotId: string) => void;
}

/**
 * IdeArboristRow
 * react-arborist 고정 1줄 높이(rowHeight=30) 전용 고밀도 노드 렌더러.
 * 가상화 윈도우 스크롤과 네이티브 드래그 앤 드롭(DnD)이 100% 안정 작동하도록
 * style 속성과 node 컨트롤러를 완벽하게 바인딩합니다.
 */
export function IdeArboristRow({
  node,
  style,
  dragHandle,
}: NodeRendererProps<IdeArboristNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { onApplySuggested, onUnbindSlot } = useIdeArboristContext();
  const data = node.data;
  const isInternal = node.isInternal;
  const isSelected = node.isSelected;
  const fieldData = data.fieldData;

  // 1. 노드 종류별 Leading 아이콘 산출
  const renderIcon = () => {
    if (data.kind === 'page') {
      return <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (data.kind === 'outline') {
      if (data.level === 1) return <Heading1 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      if (data.level === 2) return <Heading2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      if (data.level === 3) return <Heading3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    if (data.kind === 'segment') {
      switch (data.segmentType) {
        case 'table':
          return <TableIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
        case 'image':
          return <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
        case 'list':
          return <ListIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
        case 'header':
        case 'section':
          return <Heading className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
        default:
          return <Boxes className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      }
    }
    if (data.kind === 'slot') {
      if (fieldData?.status === 'bound') {
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      }
      if (fieldData?.status === 'suggested') {
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      }
      return <CircleDot className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
    if (data.kind === 'file') {
      return isInternal ? (
        <FolderTree className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      );
    }
    return <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  // 2. 인라인 편집 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      node.submit(e.currentTarget.value);
    } else if (e.key === 'Escape') {
      node.reset();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    node.submit(e.currentTarget.value);
  };

  return (
    <div
      style={{ ...style, maxWidth: '100%', overflow: 'hidden' }}
      className={`group flex items-center h-full px-1.5 text-xs select-none cursor-pointer transition-colors duration-100 max-w-full overflow-hidden ${
        isSelected
          ? 'bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-500'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border-l-2 border-transparent'
      } ${node.willReceiveDrop ? 'bg-indigo-500/30 border-y border-indigo-400' : ''}`}
      onClick={(e) => {
        node.handleClick(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. 들여쓰기 공간 (level * 6px: 휑한 빈 공간 완전 제거) */}
      <div style={{ width: `${Math.max(0, node.level * 6)}px` }} className="shrink-0 h-full" />

      {/* 2. 폴더 접기/펼침 Chevron (리프 노드는 빈 구멍 대신 4px만 남겨 정렬감 극대화) */}
      {isInternal ? (
        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mr-1">
          <button
            type="button"
            className="w-3.5 h-3.5 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
          >
            {node.isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ) : (
        <div className="w-1 shrink-0 mr-1" />
      )}

      {/* 3. 노드 종류별 대표 아이콘 (드래그 핸들 분리) */}
      <div
        ref={dragHandle}
        className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mr-1.5 cursor-grab active:cursor-grabbing"
      >
        {renderIcon()}
      </div>

      {/* 4. 라벨 (인라인 편집 모드 vs 일반 텍스트) */}
      <div className="flex-1 min-w-0 pr-1 overflow-hidden">
        {node.isEditing ? (
          <input
            type="text"
            defaultValue={node.data.name}
            autoFocus
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-5 px-1 bg-slate-950 text-white rounded border border-indigo-500 text-xs outline-none shadow-xs"
          />
        ) : (
          <span className="truncate block font-normal tracking-tight" title={node.data.name}>
            {node.data.name}
          </span>
        )}
      </div>

      {/* 5. 우측 트레일링 뱃지 & 액션 버튼군 (사이드바 폭에 맞춰 유연 축소) */}
      <div className="flex items-center gap-1 shrink-0 max-w-[50%] ml-auto pl-0.5 overflow-hidden">
        {/* 세그먼트 타입 태그 */}
        {data.kind === 'segment' && data.segmentType && (
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
            {data.segmentType}
          </span>
        )}

        {/* 슬롯 값 프리뷰 칩 (min-w-0 + truncate로 글자가 아무리 길어도 65px 이내로 깔끔하게 말줄임) */}
        {fieldData && (
          <div className="flex items-center gap-0.5 shrink min-w-0 overflow-hidden">
            {fieldData.value ? (
              <span
                className="max-w-[65px] shrink min-w-0 truncate text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 block"
                title={fieldData.value}
              >
                {fieldData.value}
              </span>
            ) : fieldData.suggestedValue ? (
              <span
                className="max-w-[65px] shrink min-w-0 text-[10px] font-mono px-1 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-0.5 overflow-hidden"
                title={`추천값: ${fieldData.suggestedValue}`}
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate min-w-0 block">{fieldData.suggestedValue}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800/60 text-slate-500 shrink-0">
                미입력
              </span>
            )}

            {/* 호버 시 퀵 액션 버튼 */}
            {isHovered && (
              <div className="flex items-center gap-0.5 ml-0.5 shrink-0">
                {fieldData.suggestedValue && !fieldData.value && onApplySuggested && (
                  <button
                    type="button"
                    title="추천값 적용"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplySuggested(fieldData.id);
                    }}
                    className="p-0.5 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 transition-colors cursor-pointer"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </button>
                )}
                {fieldData.value && onUnbindSlot && (
                  <button
                    type="button"
                    title="바인딩 해제"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnbindSlot(fieldData.id);
                    }}
                    className="p-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 transition-colors cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 일반 뱃지 (페이지 번호 또는 카운트) */}
        {data.badge !== undefined && (!fieldData || data.kind !== 'slot') && (
          <span className="shrink-0 text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
            {data.badge}
          </span>
        )}
      </div>
    </div>
  );
}
