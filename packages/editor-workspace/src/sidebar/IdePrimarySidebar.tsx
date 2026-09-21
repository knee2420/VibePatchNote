import { useState, useRef, type ReactNode } from 'react';
import {
  ListTree,
  LayoutGrid,
  FolderTree,
  FileText,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import type { TreeApi } from 'react-arborist';
import { IdeSidebarHeader } from './primitives/IdeSidebarHeader';
import { IdeSidebarSection } from './primitives/IdeSidebarSection';
import { IdeTreeRow } from './primitives/IdeTreeRow';
import { IdeHierarchyTree } from './IdeHierarchyTree';
import { IdeArboristTree } from './IdeArboristTree';
import type {
  IdeHierarchyNode,
  IdeSegmentFieldData,
  IdeTreeNodeItem,
  SidebarViewMode,
  IdeArboristNodeData,
} from './types';

export interface IdePrimarySidebarProps {
  title?: string;
  // 표시 모드: 'tabs'(스위칭 탭 방식, 권장) | 'accordion'(멀티 아코디언) | 'hierarchical'(통합 단일트리)
  displayMode?: 'tabs' | 'accordion' | 'hierarchical';
  activeSpine?: SidebarViewMode;
  onChangeSpine?: (spine: SidebarViewMode) => void;
  // 레퍼런스 열람 연동
  onToggleReferenceDoc?: () => void;
  isReferenceDocOpen?: boolean;
  // 통합 계층 노드 데이터 (레거시 호환용)
  hierarchyNodes?: IdeHierarchyNode[];
  selectedNodeId?: string;
  selectedFieldId?: string;
  onSelectNode?: (node: IdeHierarchyNode) => void;
  onSelectField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  onApplySuggestedField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  onUnbindField?: (field: IdeSegmentFieldData, parentNode: IdeHierarchyNode) => void;
  // 파일 트리 데이터
  fileTree?: IdeTreeNodeItem[];
  activeFileId?: string;
  onOpenFile?: (node: IdeTreeNodeItem) => void;

  // [신규 react-arborist 전용 데이터 및 액션]
  arboristOutlineNodes?: IdeArboristNodeData[];
  arboristSegmentNodes?: IdeArboristNodeData[];
  arboristFileNodes?: IdeArboristNodeData[];
  arboristNodes?: IdeArboristNodeData[];
  onSelectArboristNode?: (node: IdeArboristNodeData) => void;
  onSelectSlot?: (slotId: string, pageNumber: number) => void;
  onApplySuggested?: (slotId: string) => void;
  onUnbindSlot?: (slotId: string) => void;
  onMoveNode?: (args: any) => void;
  onRenameNode?: (args: { id: string; name: string }) => void;

  // 커스텀 확장 슬롯
  headerActions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * IdePrimarySidebar
 * Antigravity IDE 스타일의 좌측 메인 사이드바.
 *
 * [주요 디스플레이 모드]
 * 1. tabs (스위칭 탭 모드 - 기본 권장):
 *    - 상단 스위칭 탭 바를 통해 [목차] / [세그먼트·슬롯] / [파일] / [통합] 뷰를 원클릭으로 전환.
 *    - react-arborist 가상화 트리 엔진과 1줄 고밀도(rowHeight=30) 렌더러를 탑재하여
 *      완벽한 DnD 재정렬, 폴더 접기/펼침, 인라인 편집, 슬롯 바인딩 인터랙션을 제공합니다.
 * 2. accordion (멀티 섹션 모드):
 *    - 목차와 세그먼트 섹션을 위아래로 쌓아 동시에 여닫는 형태.
 * 3. hierarchical (올인원 모드):
 *    - 단일 3계층 통합 트리.
 */
export function IdePrimarySidebar({
  title,
  displayMode = 'tabs',
  activeSpine: controlledSpine,
  onChangeSpine,
  onToggleReferenceDoc,
  isReferenceDocOpen = false,
  hierarchyNodes = [],
  selectedNodeId,
  selectedFieldId,
  onSelectNode,
  onSelectField,
  onApplySuggestedField,
  onUnbindField,
  fileTree = [],
  activeFileId,
  onOpenFile,
  arboristOutlineNodes,
  arboristSegmentNodes,
  arboristFileNodes,
  arboristNodes,
  onSelectArboristNode,
  onSelectSlot,
  onApplySuggested,
  onUnbindSlot,
  onMoveNode,
  onRenameNode,
  headerActions,
  children,
  className = '',
}: IdePrimarySidebarProps) {
  const [internalSpine, setInternalSpine] = useState<SidebarViewMode>('outline');
  const activeSpine = controlledSpine ?? internalSpine;
  const treeRef = useRef<TreeApi<IdeArboristNodeData> | null>(null);

  const handleSelectSpine = (spine: SidebarViewMode) => {
    setInternalSpine(spine);
    onChangeSpine?.(spine);
  };

  // 탭 활성 상태 판별
  const isOutlineActive = !activeSpine || activeSpine === 'outline';
  const isSegmentsActive =
    activeSpine === 'segments' || activeSpine === 'segment' || activeSpine === 'slots';
  const isFilesActive = activeSpine === 'files' || activeSpine === 'explorer';

  // 통계 계산
  const outlineCount =
    arboristOutlineNodes?.length ||
    hierarchyNodes.filter((n) => n.kind === 'outline').length ||
    hierarchyNodes.length;

  const segmentCount =
    arboristSegmentNodes?.length ||
    hierarchyNodes.filter((n) => n.kind === 'segment').length ||
    hierarchyNodes.reduce((acc, n) => acc + (n.fields?.length ? 1 : 0), 0);

  const fileCount = arboristFileNodes?.length || fileTree.length;

  // 타이틀 산출
  const displayTitle =
    title ||
    (isOutlineActive
      ? 'Outline'
      : isSegmentsActive
      ? 'Canvas Segments'
      : isFilesActive
      ? 'Files'
      : 'Structure & Binder');

  // 파일 트리 재귀 렌더러 (레거시 폴백)
  const renderLegacyFileTree = (items: IdeTreeNodeItem[], depth = 0): ReactNode => {
    return items.map((file) => (
      <IdeTreeRow
        key={file.id}
        id={file.id}
        depth={depth}
        isFolder={file.isFolder}
        isSelected={activeFileId === file.id}
        leading={
          file.isFolder ? (
            <FolderTree className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )
        }
        primary={file.label}
        trailing={file.badge}
        onClick={() => onOpenFile?.(file)}
      />
    ));
  };

  // 현재 활성 탭에 매칭되는 arborist 노드 목록
  const currentArboristData = isOutlineActive
    ? arboristOutlineNodes
    : isSegmentsActive
    ? arboristSegmentNodes
    : isFilesActive
    ? arboristFileNodes
    : arboristNodes;

  // 전체 접기/펼치기 핸들러
  const handleCollapseAll = () => {
    treeRef.current?.closeAll();
  };
  const handleExpandAll = () => {
    treeRef.current?.openAll();
  };

  // 상단 툴바 기본 액션 (전체 접기/펼치기)
  const defaultToolbarActions = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleExpandAll}
        title="모두 펼치기 (Expand All)"
        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <ChevronsUpDown className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={handleCollapseAll}
        title="모두 접기 (Collapse All)"
        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <ChevronsDownUp className="w-3.5 h-3.5" />
      </button>
      {headerActions}
    </div>
  );

  return (
    <div
      className={`w-full h-full bg-slate-900 flex flex-col text-slate-300 overflow-hidden select-none font-sans ${className}`}
    >
      {/* 1. 상단 글로벌 헤더 & 스위칭 탭 바 */}
      <IdeSidebarHeader
        title={displayTitle}
        onToggleReferenceDoc={onToggleReferenceDoc}
        isReferenceDocOpen={isReferenceDocOpen}
        actions={defaultToolbarActions}
        viewSelector={
          displayMode === 'tabs' ? (
            /* 직관적인 스위칭 탭 바 (Segmented Switcher) */
            <div className="flex items-center p-0.5 bg-slate-950/90 rounded-lg border border-slate-800/80 text-xs shadow-inner">
              {/* [탭 1] 목차 (Outline) */}
              <button
                type="button"
                onClick={() => handleSelectSpine('outline')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
                  isOutlineActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
                title="목차 뷰로 전환"
              >
                <ListTree className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">목차</span>
                {outlineCount > 0 && (
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400">
                    {outlineCount}
                  </span>
                )}
              </button>

              {/* [탭 2] 세그먼트 & 슬롯 (Segments & Slots) */}
              <button
                type="button"
                onClick={() => handleSelectSpine('segments')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
                  isSegmentsActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
                title="캔버스 세그먼트 및 슬롯 소켓 뷰로 전환"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">세그먼트</span>
                {segmentCount > 0 && (
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400">
                    {segmentCount}
                  </span>
                )}
              </button>

              {/* [탭 3] 파일 (Files) */}
              {(fileTree.length > 0 || (arboristFileNodes && arboristFileNodes.length > 0)) && (
                <button
                  type="button"
                  onClick={() => handleSelectSpine('files')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
                    isFilesActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                  title="파일 탐색기 뷰로 전환"
                >
                  <FolderTree className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">파일</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400">
                    {fileCount}
                  </span>
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* 2. 본문 뷰 렌더링 (react-arborist 우선, 레거시 fallback 완비) */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {children ? (
          children
        ) : currentArboristData ? (
          /* [react-arborist 가상화 트리 전용 렌더링] */
          <IdeArboristTree
            ref={treeRef}
            data={currentArboristData}
            selectedId={selectedNodeId}
            onSelectNode={(node) => {
              onSelectArboristNode?.(node);
            }}
            onSelectSlot={onSelectSlot}
            onApplySuggested={onApplySuggested}
            onUnbindSlot={onUnbindSlot}
            onMove={onMoveNode}
            onRename={({ id, name }) => onRenameNode?.({ id, name })}
          />
        ) : displayMode === 'accordion' ? (
          /* [아코디언 모드 (레거시)] */
          <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <IdeSidebarSection
              title="Outline"
              countBadge={outlineCount}
              defaultCollapsed={false}
            >
              <IdeHierarchyTree
                nodes={hierarchyNodes}
                projectionMode="outline"
                selectedId={selectedNodeId}
                onSelectNode={onSelectNode}
              />
            </IdeSidebarSection>

            <IdeSidebarSection
              title="Canvas Segments & Slots"
              countBadge={segmentCount || undefined}
              defaultCollapsed={false}
            >
              <IdeHierarchyTree
                nodes={hierarchyNodes}
                projectionMode="segments"
                selectedId={selectedNodeId}
                selectedFieldId={selectedFieldId}
                onSelectNode={onSelectNode}
                onSelectField={onSelectField}
                onApplySuggestedField={onApplySuggestedField}
                onUnbindField={onUnbindField}
              />
            </IdeSidebarSection>

            {fileTree.length > 0 && (
              <IdeSidebarSection
                title="Files"
                countBadge={fileTree.length}
                defaultCollapsed={true}
              >
                <div className="py-1">{renderLegacyFileTree(fileTree)}</div>
              </IdeSidebarSection>
            )}
          </div>
        ) : displayMode === 'tabs' ? (
          /* [스위칭 탭 모드 (레거시)] */
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {isFilesActive ? (
              <div className="py-1">{renderLegacyFileTree(fileTree)}</div>
            ) : (
              <IdeHierarchyTree
                nodes={hierarchyNodes}
                projectionMode={isOutlineActive ? 'outline' : 'segments'}
                selectedId={selectedNodeId}
                selectedFieldId={selectedFieldId}
                onSelectNode={onSelectNode}
                onSelectField={onSelectField}
                onApplySuggestedField={onApplySuggestedField}
                onUnbindField={onUnbindField}
              />
            )}
          </div>
        ) : (
          /* [통합 모드 (레거시)] */
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <IdeHierarchyTree
              nodes={hierarchyNodes}
              projectionMode="hierarchical"
              selectedId={selectedNodeId}
              selectedFieldId={selectedFieldId}
              onSelectNode={onSelectNode}
              onSelectField={onSelectField}
              onApplySuggestedField={onApplySuggestedField}
              onUnbindField={onUnbindField}
            />
          </div>
        )}
      </div>
    </div>
  );
}
