import { memo, useMemo, useState } from 'react';
import { Box, FileText, GitMerge, GripVertical, Layers3, Loader2, Table2, Unlink } from 'lucide-react';

import { isOutsideOwner } from '../model/containment';
import { SEGMENT_ELEMENT_MIME } from '../model/dragTransfer';
import type {
  DocumentSegmentItem,
  RelationshipTargetKind,
  SegmentStructureResponse,
  SegmentStructureTarget,
  StructureElementSelection,
} from '../model/types';

interface SegmentStructureTreeProps {
  title: string;
  structure: SegmentStructureResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedSegmentId: string | null;
  isEditMode: boolean;
  /** 병합 후보. 선택과 **다른 상태**이고 고른 순서가 번호로 보인다. */
  mergeCandidateIds: string[];
  /** 지금 병합하면 고르지 않았어도 함께 사라지는 세그먼트. */
  absorbedSegmentIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  onSelectSegment: (segment: DocumentSegmentItem) => void;
  onSelectElement: (element: StructureElementSelection) => void;
  /** 행에 마우스를 올렸을 때 원본 위에 미리 보여 줄 대상. 떼면 `null`. */
  onHoverElement: (element: StructureElementSelection | null) => void;
  onHoverSegment: (segment: DocumentSegmentItem | null) => void;
  onToggleMergeCandidate: (segmentId: string) => void;
  onAssign: (
    targetKind: RelationshipTargetKind,
    targetId: string,
    primarySegmentId: string | null,
  ) => void;
  onResetRelationship: (targetKind: RelationshipTargetKind, targetId: string) => void;
  onToggleEdit: () => void;
  onMerge: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
}

interface DragTarget {
  kind: RelationshipTargetKind;
  target: SegmentStructureTarget;
}

export const SegmentStructureTree = memo(function SegmentStructureTree({
  title,
  structure,
  isLoading,
  error,
  selectedSegmentId,
  isEditMode,
  mergeCandidateIds,
  absorbedSegmentIds,
  canUndo,
  canRedo,
  onSelectSegment,
  onSelectElement,
  onHoverElement,
  onHoverSegment,
  onToggleMergeCandidate,
  onAssign,
  onResetRelationship,
  onToggleEdit,
  onMerge,
  onUndo,
  onRedo,
  onClose,
}: SegmentStructureTreeProps) {
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  /** 사람이 직접 정한 관계. 자동으로 되돌릴 수 있다는 표시가 필요하다. */
  const overriddenTargets = useMemo(
    () =>
      new Set(
        (structure?.mappings ?? [])
          .filter((item) => item.source === 'override')
          .map((item) => `${item.targetKind}:${item.targetId}`)
      ),
    [structure]
  );
  const mapped = useMemo(() => {
    const bySegment = new Map<string, DragTarget[]>();
    const unassigned: DragTarget[] = [];
    if (!structure) return { bySegment, unassigned };
    const mappingByTarget = new Map(
      structure.mappings.map((item) => [`${item.targetKind}:${item.targetId}`, item]),
    );
    const append = (kind: DragTarget['kind'], target: SegmentStructureTarget) => {
      const mapping = mappingByTarget.get(`${kind}:${target.id}`);
      const item = { kind, target };
      if (!mapping?.primarySegmentId) {
        unassigned.push(item);
        return;
      }
      const values = bySegment.get(mapping.primarySegmentId) || [];
      values.push(item);
      bySegment.set(mapping.primarySegmentId, values);
    };
    structure.outlineElements.forEach((target) => append('outline_element', target));
    structure.wireframeBlocks.forEach((target) => append('wireframe_block', target));
    return { bySegment, unassigned };
  }, [structure]);
  const segmentsByPage = useMemo(() => {
    if (!structure) return [] as Array<[number, DocumentSegmentItem[]]>;
    const grouped = new Map<number, DocumentSegmentItem[]>();
    structure.segments.forEach((segment) => {
      const values = grouped.get(segment.page) || [];
      values.push(segment);
      grouped.set(segment.page, values);
    });
    return [...grouped.entries()].sort(([left], [right]) => left - right);
  }, [structure]);

  const toSelection = (item: DragTarget): StructureElementSelection | null =>
    item.kind === 'outline_element'
      ? {
          id: item.target.id,
          type: item.target.type,
          label: item.target.label,
          page: item.target.page,
          box_2d: item.target.box_2d || [0, 0, 1, 1],
        }
      : null;

  const selectTarget = (item: DragTarget) => {
    const selection = toSelection(item);
    if (selection) onSelectElement(selection);
  };

  return (
    <div className="w-[340px] h-full flex flex-col border-l border-slate-200 bg-white dark:bg-slate-900 text-xs shrink-0 overflow-hidden nodrag">
      <div className="h-9 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers3 className="w-3.5 h-3.5 text-violet-600" />
          <span className="font-bold tracking-wider uppercase text-[10px] text-slate-500">SEGMENTS</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-600" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleEdit}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isEditMode ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'}`}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </button>
          {isEditMode && (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-transparent"
                title="되돌리기 (Ctrl+Z)"
              >
                되돌리기
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-transparent"
                title="다시 실행 (Ctrl+Shift+Z)"
              >
                다시
              </button>
            </>
          )}
          {isEditMode && mergeCandidateIds.length > 1 && (
            <button
              onClick={onMerge}
              className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 flex items-center gap-1 font-semibold text-[10px]"
              title="고른 세그먼트를 한 영역으로 합칩니다"
            >
              <GitMerge className="w-3 h-3" />
              {mergeCandidateIds.length + absorbedSegmentIds.length}개 병합
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">×</button>
        </div>
      </div>

      {isEditMode && absorbedSegmentIds.length > 0 && (
        <p className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[10px] text-amber-800">
          고르지 않은 {absorbedSegmentIds.length}개가 합쳐진 영역 안에 들어와 함께 사라집니다.
        </p>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {error && <p className="px-3 py-2 text-rose-600">{error}</p>}
        {!error && !isLoading && !structure && <p className="px-3 py-2 text-slate-400">세그먼트 분석 결과가 없습니다.</p>}
        {segmentsByPage.map(([page, pageSegments]) => (
          <section key={page} className="mb-3">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Page {page}
            </div>
            {pageSegments.map((segment) => {
              const candidateIndex = mergeCandidateIds.indexOf(segment.id);
              const isCandidate = candidateIndex >= 0;
              const isAbsorbed = absorbedSegmentIds.includes(segment.id);
              const isSelected = selectedSegmentId === segment.id;
              const isDropTarget = dropTargetId === segment.id;
              // 같은 페이지만 받는다. 받을 수 없는 곳은 표시도 하지 않는다.
              const canDrop = Boolean(dragTarget) && dragTarget?.target.page === segment.page;
              return (
                <div
                  key={segment.id}
                  onDragOver={(event) => {
                    if (!isEditMode || !canDrop) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'move';
                    setDropTargetId(segment.id);
                  }}
                  onMouseEnter={() => onHoverSegment(segment)}
                  onMouseLeave={() => onHoverSegment(null)}
                  onDragLeave={() => setDropTargetId((prev) => (prev === segment.id ? null : prev))}
                  onDrop={(event) => {
                    if (!canDrop) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (dragTarget) onAssign(dragTarget.kind, dragTarget.target.id, segment.id);
                    setDragTarget(null);
                    setDropTargetId(null);
                  }}
                  className={`mx-2 mb-2 rounded border transition-colors ${
                    isDropTarget
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                      : isCandidate
                        ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                        : isAbsorbed
                          ? 'border-amber-400 border-dashed bg-amber-50/70'
                          : isSelected
                            ? 'border-slate-400 bg-slate-50'
                            : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={(event) => {
                      // Shift 는 병합 후보 토글. 일반 클릭은 선택이고, 후보는 건드리지 않는다.
                      if (isEditMode && event.shiftKey) {
                        onToggleMergeCandidate(segment.id);
                        return;
                      }
                      onSelectSegment(segment);
                    }}
                    className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-slate-50"
                  >
                    {isCandidate ? (
                      <span className="w-4 h-4 shrink-0 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {candidateIndex + 1}
                      </span>
                    ) : (
                      <Box className={`w-3.5 h-3.5 ${isAbsorbed ? 'text-amber-500' : 'text-violet-500'}`} />
                    )}
                    <span className="flex-1 truncate font-medium">{segment.label}</span>
                    {isAbsorbed && <span className="text-[9px] text-amber-700 font-semibold shrink-0">흡수됨</span>}
                    <span className="font-mono text-[10px] text-slate-400">{segment.type}</span>
                  </button>
                  <TargetList
                    items={mapped.bySegment.get(segment.id) || []}
                    editable={isEditMode}
                    ownerBox={segment.box_2d}
                    overridden={overriddenTargets}
                    onDragStart={setDragTarget}
                    onDragEnd={() => { setDragTarget(null); setDropTargetId(null); }}
                    onSelect={selectTarget}
                    onHover={(item) => onHoverElement(item ? toSelection(item) : null)}
                    onUnassign={(item) => onAssign(item.kind, item.target.id, null)}
                    onReset={(item) => onResetRelationship(item.kind, item.target.id)}
                  />
                </div>
              );
            })}
          </section>
        ))}

        {mapped.unassigned.length > 0 && (
          <div className="mx-2 mt-3 rounded border border-dashed border-slate-300">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500">UNASSIGNED</div>
            <TargetList
              items={mapped.unassigned}
              editable={isEditMode}
              ownerBox={null}
              overridden={overriddenTargets}
              onDragStart={setDragTarget}
              onDragEnd={() => { setDragTarget(null); setDropTargetId(null); }}
              onSelect={selectTarget}
              onHover={(item) => onHoverElement(item ? toSelection(item) : null)}
              onReset={(item) => onResetRelationship(item.kind, item.target.id)}
            />
          </div>
        )}
      </div>
      <div className="h-6 px-3 border-t border-slate-200 text-[10px] text-slate-400 flex items-center truncate">{title}</div>
    </div>
  );
});

interface TargetListProps {
  items: DragTarget[];
  editable: boolean;
  /** 이 목록이 매달린 세그먼트의 영역. 미배정 목록은 소유자가 없다. */
  ownerBox: readonly number[] | null;
  /** 사람이 직접 정한 관계들. 자동 분석으로 되돌릴 수 있다는 표시가 필요하다. */
  overridden: Set<string>;
  onDragStart: (item: DragTarget) => void;
  onDragEnd: () => void;
  onSelect: (item: DragTarget) => void;
  onHover: (item: DragTarget | null) => void;
  onUnassign?: (item: DragTarget) => void;
  onReset: (item: DragTarget) => void;
}

function TargetList({
  items,
  editable,
  ownerBox,
  overridden,
  onDragStart,
  onDragEnd,
  onSelect,
  onHover,
  onUnassign,
  onReset,
}: TargetListProps) {
  return items.map((item) => {
    const Icon = item.kind === 'outline_element' ? FileText : Table2;
    const isOverridden = overridden.has(`${item.kind}:${item.target.id}`);
    // 소속 세그먼트 영역 밖에 붙은 관계. 각주·캡션처럼 일부러 그럴 수 있지만,
    // 화면에 표시가 없으면 오조작과 구분되지 않는다.
    const isOutside = isOutsideOwner(item.target.box_2d, ownerBox);
    return (
      <div
        key={`${item.kind}:${item.target.id}`}
        draggable={editable}
        onDragStart={(event) => {
          // **전용 MIME 을 심는다.** 이게 없으면 Firefox 는 드래그를 시작조차 하지
          // 않고, 캔버스의 파일 드롭 처리기가 이 드래그를 파일로 오인해 전체 화면
          // 오버레이를 띄운다.
          event.dataTransfer.setData(SEGMENT_ELEMENT_MIME, item.target.id);
          event.dataTransfer.effectAllowed = 'move';
          onDragStart(item);
        }}
        onDragEnd={onDragEnd}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(item)}
        className="group px-2 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 text-slate-600"
      >
        {editable && <GripVertical className="w-3 h-3 text-slate-300" />}
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="flex-1 truncate">{item.target.label}</span>
        {isOutside && (
          <span
            className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-semibold shrink-0"
            title="이 항목은 소속 세그먼트 영역 밖에 있습니다"
          >
            영역 밖
          </span>
        )}
        {isOverridden && (
          <span className="text-[9px] text-violet-600 font-semibold shrink-0" title="사람이 지정한 관계">
            수동
          </span>
        )}
        {editable && isOverridden && (
          <button
            onClick={(event) => { event.stopPropagation(); onReset(item); }}
            title="자동 분석 결과로 되돌리기"
            className="text-[9px] px-1 rounded text-slate-400 hover:text-violet-700 hover:bg-violet-100 shrink-0"
          >
            자동
          </button>
        )}
        {editable && onUnassign && (
          <button onClick={(event) => { event.stopPropagation(); onUnassign(item); }} title="관계 해제">
            <Unlink className="w-3 h-3 text-slate-400 hover:text-rose-500" />
          </button>
        )}
      </div>
    );
  });
}
