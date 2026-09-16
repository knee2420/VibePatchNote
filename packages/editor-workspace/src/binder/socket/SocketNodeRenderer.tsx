import { memo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { SocketStateBadge } from './SocketStateBadge';
import { ProvenanceChipList } from '../provenance/ProvenanceChipList';
import { CrossDomainBridgeTag } from '../bridge/CrossDomainBridgeTag';
import { NodeActionBar } from '../actions/NodeActionBar';
import type { SocketNodeRendererProps } from './types';

/**
 * SocketNodeRenderer (소켓/슬롯형 트리 노드 렌더러)
 *
 * 정적 텍스트를 넘어 데이터가 채워지는 '소켓(Socket)'으로 동작하는 바인더 노드.
 * - 슬롯 번호 및 허용 타입 뱃지
 * - 드롭 타깃 하이라이트 반응 (드래그 오버 시 펄스)
 * - 매핑 상태(Empty / Filled / Conflict) 뱃지
 * - 교차 도메인 미러 뱃지(CrossDomainBridgeTag)
 * - 원천 출처 칩(ProvenanceChipList)
 * - 호버 시 인라인 액션 바(NodeActionBar)
 */
export const SocketNodeRenderer = memo(function SocketNodeRenderer<T = Record<string, unknown>>({
  node,
  style,
  dragHandle,
  onDropAsset,
  onSelectProvenance,
  onClickBridge,
  onTriggerAction,
  className = '',
}: SocketNodeRendererProps<T>) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { data, isOpen, isSelected, isLeaf, level } = node;

  const isFolder = data.isFolder || !isLeaf;
  const slotNumber = data.slotNumber;
  const fillingState = data.fillingState || (isFolder ? undefined : 'empty');
  const acceptTypes = data.acceptTypes || [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const payload = e.dataTransfer.getData('application/json');
      if (payload) {
        const parsed = JSON.parse(payload) as { id: string; type: string };
        onDropAsset?.(node.id, parsed.id, parsed.type);
      }
    } catch {
      // ignore parsing error
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => node.select()}
      className={`
        group relative flex items-center justify-between gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer select-none transition-all
        ${
          isSelected
            ? 'bg-indigo-950/70 border border-indigo-500/70 text-indigo-100 font-medium'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
        }
        ${
          isDragOver
            ? 'ring-2 ring-indigo-400 bg-indigo-900/60 border-indigo-400 shadow-lg scale-[1.01]'
            : ''
        }
        ${className}
      `}
    >
      {/* 좌측: 인덴트 + 접기 토글 + 아이콘 + 타이틀 */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1" style={{ paddingLeft: `${level * 12}px` }}>
        {isFolder ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}

        {/* 타입별 아이콘 */}
        <span className="shrink-0 text-slate-400 group-hover:text-slate-200">
          {isFolder ? (
            isOpen ? <FolderOpen className="w-3.5 h-3.5 text-amber-400" /> : <Folder className="w-3.5 h-3.5 text-amber-400/80" />
          ) : slotNumber !== undefined ? (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-indigo-300 font-semibold">
              #{slotNumber}
            </span>
          ) : (
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          )}
        </span>

        {/* 이름 */}
        <span className="truncate font-medium text-xs text-slate-200">{data.name}</span>

        {/* 허용 타입 태그 (Slot Spec 힌트) */}
        {acceptTypes.length > 0 && (
          <div className="hidden sm:flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            {acceptTypes.map((t) => (
              <span key={t} className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono" title={`허용: ${t}`}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 우측: 소켓 상태 + 교차 뱃지 + 출처 칩 + 인라인 액션 바 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 교차 도메인 미러 뱃지 */}
        {data.bridges && data.bridges.length > 0 && (
          <div className="flex items-center gap-1">
            {data.bridges.map((b, idx) => (
              <CrossDomainBridgeTag key={idx} item={b} onClick={onClickBridge} />
            ))}
          </div>
        )}

        {/* 소켓 매핑 상태 뱃지 */}
        {fillingState && (
          <SocketStateBadge
            state={fillingState}
            count={data.mappedCount}
            reason={data.conflictReason}
          />
        )}

        {/* 원천 출처 칩 (호버 또는 항상) */}
        {data.provenances && data.provenances.length > 0 && (
          <ProvenanceChipList items={data.provenances} onSelect={onSelectProvenance} maxVisible={1} />
        )}

        {/* 노드 인라인 액션 바 (마우스 호버 시 떠오름) */}
        {data.actions && data.actions.length > 0 && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <NodeActionBar
              actions={data.actions}
              onTrigger={(actionId) => onTriggerAction?.(actionId, node.id)}
              size="xs"
            />
          </div>
        )}
      </div>
    </div>
  );
});
