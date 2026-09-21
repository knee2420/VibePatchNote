import { useState, type ReactNode } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading,
  Table as TableIcon,
  Image as ImageIcon,
  List as ListIcon,
  FileText,
  Boxes,
  Folder,
} from 'lucide-react';
import { IdeTreeRow } from './primitives/IdeTreeRow';
import { IdeFieldSocket } from './primitives/IdeFieldSocket';
import type {
  IdeHierarchyNode,
  HierarchyProjectionMode,
  IdeSegmentFieldData,
} from './types';

export interface IdeHierarchyTreeProps {
  nodes: IdeHierarchyNode[];
  projectionMode?: HierarchyProjectionMode;
  selectedId?: string;
  selectedFieldId?: string;
  onSelectNode?: (node: IdeHierarchyNode) => void;
  onSelectField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  onApplySuggestedField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  onUnbindField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  renderCustomRow?: (node: IdeHierarchyNode, depth: number) => ReactNode;
  className?: string;
}

/** 노드 종류/레벨별 아이콘 헬퍼 */
function renderNodeIcon(node: IdeHierarchyNode) {
  if (node.kind === 'page') {
    return <Folder className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />;
  }
  if (node.kind === 'outline') {
    if (node.level === 1) return <Heading1 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    if (node.level === 2) return <Heading2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    if (node.level === 3) return <Heading3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
  if (node.kind === 'segment') {
    switch (node.segmentType) {
      case 'header':
      case 'section':
        return <Heading className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'list':
        return <ListIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      default:
        return <Boxes className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
  }
  return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

/**
 * IdeHierarchyTree
 * 아웃라인(목차), 세그먼트(물리 블록), 와이어 슬롯(매핑 필드)을 하나의 창 안에서
 * 유기적으로 결합하여 렌더링하는 통합 계층 트리 엔진.
 * IdeTreeRow와 IdeFieldSocket을 레고 블록 단위로 조합합니다.
 */
export function IdeHierarchyTree({
  nodes,
  projectionMode = 'hierarchical',
  selectedId,
  selectedFieldId,
  onSelectNode,
  onSelectField,
  onApplySuggestedField,
  onUnbindField,
  renderCustomRow,
  className = '',
}: IdeHierarchyTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false, // 기본값 열림
    }));
  };

  // 재귀적 노드 조립 렌더러
  const renderTree = (items: IdeHierarchyNode[], depth = 0): ReactNode => {
    return items.map((node) => {
      // 프로젝션 모드 필터링: 목차와 세그먼트의 엄격한 역할 분리
      if (projectionMode === 'outline' && node.kind !== 'outline') {
        return null;
      }
      if (projectionMode === 'segments' && node.kind === 'outline') {
        return null;
      }

      if (renderCustomRow) {
        return renderCustomRow(node, depth);
      }

      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = expandedIds[node.id] ?? true;
      const isSelected = selectedId === node.id;
      const fields = node.fields || [];

      // 1. Trailing 메타데이터 슬롯 조립
      let trailingNode: ReactNode = null;
      if (node.pageNumber !== undefined) {
        trailingNode = (
          <span className="text-[10px] font-mono text-slate-500">
            {node.pageNumber}P
          </span>
        );
      }
      if (fields.length > 0) {
        const boundCount = fields.filter((f) => f.status === 'bound').length;
        trailingNode = (
          <div className="flex items-center gap-1">
            {trailingNode}
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
              {boundCount}/{fields.length}
            </span>
          </div>
        );
      }

      // 2. Accessories 슬롯 조립 (세그먼트 행 하위에 직속으로 붙는 1:N 인라인 필드 소켓 리스트)
      // 목차(outline) 프로젝션에서는 소켓 목록을 숨겨 목차 탐색 본연에 집중하고, 세그먼트/통합 모드에서 소켓 표시
      let accessoriesNode: ReactNode = null;
      if (projectionMode !== 'outline' && fields.length > 0 && isExpanded) {
        accessoriesNode = (
          <div className="space-y-1">
            {fields.map((field) => (
              <IdeFieldSocket
                key={field.id}
                id={field.id}
                fieldName={field.fieldName}
                fieldKey={field.fieldKey}
                value={field.value}
                status={field.status}
                suggestedValue={field.suggestedValue}
                confidence={field.confidence}
                resourceName={field.resourceName}
                sourceLocation={field.sourceLocation}
                compact={true}
                isSelected={selectedFieldId === field.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectField?.(field, node);
                }}
                onApplySuggested={(e) => {
                  e.stopPropagation();
                  onApplySuggestedField?.(field, node);
                }}
                onUnbind={(e) => {
                  e.stopPropagation();
                  onUnbindField?.(field, node);
                }}
              />
            ))}
          </div>
        );
      }

      return (
        <div key={node.id} className="flex flex-col">
          <IdeTreeRow
            id={node.id}
            depth={depth}
            isFolder={hasChildren}
            isExpanded={isExpanded}
            isSelected={isSelected}
            leading={renderNodeIcon(node)}
            primary={node.title}
            secondary={
              node.kind === 'segment' && node.segmentType ? (
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400">
                  {node.segmentType}
                </span>
              ) : undefined
            }
            trailing={trailingNode}
            accessories={accessoriesNode}
            onClick={() => onSelectNode?.(node)}
            onToggleExpand={() => toggleExpand(node.id)}
          />

          {/* 하위 자식 노드 재귀 렌더링 */}
          {hasChildren && isExpanded && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-800 select-none ${className}`}>
      {nodes.length > 0 ? (
        renderTree(nodes)
      ) : (
        <div className="py-8 text-center text-xs text-slate-500">
          표시할 계층 노드가 없습니다.
        </div>
      )}
    </div>
  );
}
