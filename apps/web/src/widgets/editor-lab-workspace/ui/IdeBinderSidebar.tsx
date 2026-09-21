import { useState, useEffect, useMemo, startTransition } from 'react';
import {
  IdePrimarySidebar,
  buildOutlineHierarchyTree,
  buildSegmentHierarchyTree,
  buildOutlineArboristTree,
  buildSegmentArboristTree,
  buildFileArboristTree,
  type IdeHierarchyNode,
  type IdeTreeNodeItem,
  type RawOutlineHierarchyItem,
  type IdeArboristNodeData,
} from '@vibe/editor-workspace';
import { useSegmentStructure } from '@/entities/document-segment';
import { referenceDocumentApi } from '@/entities/reference-document';
import type { EditorTabItem, FileTreeNode, ResourceItem, SlotBindingInfo } from '../model/types';
import type { ScaffoldSlot } from '@/entities/scaffold-document';

export type BinderSpineMode = 'outline' | 'segment' | 'slots' | 'explorer';

export interface BinderContextMenuState {
  x: number;
  y: number;
  id: string;
  title: string;
  page?: number;
  isFolder?: boolean;
  isRoot?: boolean;
  slotId?: string;
}

export interface IdeBinderSidebarProps {
  scaffoldId?: string;
  docId?: string;
  documentTitle?: string;
  slots?: ScaffoldSlot[];
  fileTree: FileTreeNode[];
  activeNodeId?: string;
  activeTab?: EditorTabItem;
  activePageNumber?: number;
  onOpenFile: (node: FileTreeNode) => void;
  onSelectPage?: (pageNumber: number) => void;
  onOpenPageTab?: (pageNumber: number, pane?: 'pane1' | 'pane2') => void;
  selectedSlotId?: string | null;
  onSelectSlot?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  onOpenScrivenings?: () => void;
  onOpenResourceModal?: (resource: ResourceItem) => void;
  stagingResources?: ResourceItem[];
  // 슬롯 소켓 바인딩 props
  slotBindings?: Record<string, SlotBindingInfo>;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;
  onUnbindSlot?: (slotId: string) => void;
  onApplySuggested?: (slotId: string) => void;
  onApplyAllSuggestions?: () => void;
  onResetAllSlots?: () => void;
  onOpenSlotProvenance?: (binding: SlotBindingInfo) => void;
  onToggleReferenceDoc?: () => void;
  isReferenceDocOpen?: boolean;
  activeSpine?: BinderSpineMode;
  onChangeSpine?: (spine: BinderSpineMode) => void;
}

/**
 * IdeBinderSidebar
 * @vibe/editor-workspace의 react-arborist 가상화 트리 엔진과 정본 계층 트리 빌더(buildOutlineArboristTree, buildSegmentArboristTree)로
 * 백엔드 영속 데이터(tree.json, segments.json)의 완벽한 1줄 고밀도(rowHeight=30) 트리 구조를 복원하여 조립합니다.
 */
export function IdeBinderSidebar({
  docId = 'doc-1a0897500d9-989a3b2b',
  documentTitle = '회의비 사용 내역',
  slots = [],
  fileTree,
  onOpenFile,
  onSelectPage,
  selectedSlotId,
  onSelectSlot,
  slotBindings,
  onUnbindSlot,
  onApplySuggested,
  onToggleReferenceDoc,
  isReferenceDocOpen,
  activeSpine = 'outline',
  onChangeSpine,
}: IdeBinderSidebarProps) {
  // 1. 백엔드 세그먼트 결합 구조 로드 (segments.json)
  const { structure } = useSegmentStructure(docId, Boolean(docId));

  // 2. 백엔드 정본 계층 목차 트리 로드 (tree.json: H1 -> H2 -> H3)
  const [rawOutlines, setRawOutlines] = useState<RawOutlineHierarchyItem[]>([]);

  useEffect(() => {
    if (!docId) return;
    let isCancelled = false;

    referenceDocumentApi
      .getOutline(docId)
      .then((res) => {
        if (!isCancelled && res.outlines && res.outlines.length > 0) {
          setRawOutlines(res.outlines as unknown as RawOutlineHierarchyItem[]);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[IdeBinderSidebar] 정본 아웃라인 조회 보류/실패:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [docId]);

  // 3. react-arborist 목차 트리 데이터 빌드
  const arboristOutlineNodes = useMemo<IdeArboristNodeData[]>(() => {
    if (rawOutlines.length > 0) {
      return buildOutlineArboristTree(rawOutlines, slots, slotBindings);
    }
    if (structure && structure.outlineElements && structure.outlineElements.length > 0) {
      return buildOutlineArboristTree(
        structure.outlineElements.map((el) => ({
          id: el.id,
          title: el.label,
          page: el.page,
          level: 2,
        })),
        slots,
        slotBindings
      );
    }
    return [
      {
        id: 'doc-root-outline',
        name: documentTitle,
        isInternal: true,
        kind: 'outline',
        level: 1,
        pageNumber: 1,
      },
    ];
  }, [rawOutlines, structure, slots, slotBindings, documentTitle]);

  // 4. react-arborist 세그먼트 트리 데이터 빌드 (Page -> Block -> Slot 1줄 구조)
  const arboristSegmentNodes = useMemo<IdeArboristNodeData[]>(() => {
    return buildSegmentArboristTree(
      structure?.segments || [],
      slots,
      slotBindings,
      structure?.mappings,
      structure?.outlineElements
    );
  }, [structure, slots, slotBindings]);

  // 5. react-arborist 파일 탐색기 트리 데이터 빌드
  const arboristFileNodes = useMemo<IdeArboristNodeData[]>(() => {
    return buildFileArboristTree(fileTree);
  }, [fileTree]);

  // 6. 레거시 호환용 hierarchyNodes
  const legacyHierarchyNodes = useMemo<IdeHierarchyNode[]>(() => {
    const outlineNodes =
      rawOutlines.length > 0
        ? buildOutlineHierarchyTree(rawOutlines, slots, slotBindings)
        : [];
    const segmentNodes = buildSegmentHierarchyTree(
      structure?.segments || [],
      slots,
      slotBindings
    );
    return [...outlineNodes, ...segmentNodes];
  }, [rawOutlines, structure, slots, slotBindings]);

  // 7. 레거시 호환용 mappedFileTree
  const mappedFileTree = useMemo<IdeTreeNodeItem[]>(() => {
    const mapNodes = (nodes: FileTreeNode[]): IdeTreeNodeItem[] => {
      return nodes.map((node) => ({
        id: node.id,
        label: node.name,
        isFolder: node.isFolder,
        isOpen: node.isOpen,
        children: node.children ? mapNodes(node.children) : undefined,
      }));
    };
    return mapNodes(fileTree);
  }, [fileTree]);

  return (
    <IdePrimarySidebar
      title="Structure & Binder"
      displayMode="tabs"
      activeSpine={activeSpine}
      onChangeSpine={(s) => {
        const mappedSpine: BinderSpineMode =
          s === 'segments' ? 'segment' : s === 'files' ? 'explorer' : (s as BinderSpineMode);
        onChangeSpine?.(mappedSpine);
      }}
      onToggleReferenceDoc={onToggleReferenceDoc}
      isReferenceDocOpen={isReferenceDocOpen}
      // react-arborist 최신 노드 주입
      arboristOutlineNodes={arboristOutlineNodes}
      arboristSegmentNodes={arboristSegmentNodes}
      arboristFileNodes={arboristFileNodes}
      selectedNodeId={selectedSlotId || undefined}
      onSelectArboristNode={(node) => {
        if (node.kind === 'page' && node.pageNumber) {
          onSelectPage?.(node.pageNumber);
        }
      }}
      onSelectSlot={(slotId, pageNumber) => {
        startTransition(() => {
          onSelectSlot?.(slotId, pageNumber);
        });
      }}
      onApplySuggested={(slotId) => {
        onApplySuggested?.(slotId);
      }}
      onUnbindSlot={(slotId) => {
        onUnbindSlot?.(slotId);
      }}
      onOpenFile={(treeNode) => {
        const found = fileTree.find((f) => f.id === treeNode.id);
        if (found) onOpenFile(found);
      }}
      // 레거시 props 보존
      hierarchyNodes={legacyHierarchyNodes}
      fileTree={mappedFileTree}
    />
  );
}
