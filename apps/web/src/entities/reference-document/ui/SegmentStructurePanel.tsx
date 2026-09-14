import { memo, useMemo, useState } from 'react';
import { Box, FileText, GitMerge, GripVertical, Layers3, Loader2, Table2, Unlink } from 'lucide-react';

import type {
  DocumentElementItem,
  DocumentSegmentItem,
  SegmentStructureResponse,
  SegmentStructureTarget,
} from '../model/types';

interface SegmentStructurePanelProps {
  title: string;
  structure: SegmentStructureResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedSegmentId: string | null;
  isEditMode: boolean;
  onSelectSegment: (segment: DocumentSegmentItem) => void;
  onSelectElement: (element: DocumentElementItem) => void;
  onAssign: (
    targetKind: 'outline_element' | 'wireframe_block',
    targetId: string,
    primarySegmentId: string | null,
  ) => void;
  onToggleEdit: () => void;
  onMerge: (segmentIds: string[]) => void;
  onClose: () => void;
}

interface DragTarget {
  kind: 'outline_element' | 'wireframe_block';
  target: SegmentStructureTarget;
}

export const SegmentStructurePanel = memo(function SegmentStructurePanel({
  title,
  structure,
  isLoading,
  error,
  selectedSegmentId,
  isEditMode,
  onSelectSegment,
  onSelectElement,
  onAssign,
  onToggleEdit,
  onMerge,
  onClose,
}: SegmentStructurePanelProps) {
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [mergeCandidates, setMergeCandidates] = useState<string[]>([]);
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

  const selectTarget = (item: DragTarget) => {
    if (item.kind !== 'outline_element') return;
    onSelectElement({
      id: item.target.id,
      type: item.target.type,
      label: item.target.label,
      page: item.target.page,
      box_2d: item.target.box_2d || [0, 0, 1, 1],
    });
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
          {isEditMode && mergeCandidates.length > 1 && (
            <button
              onClick={() => { onMerge(mergeCandidates); setMergeCandidates([]); }}
              className="p-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200"
              title="선택 세그먼트 병합"
            >
              <GitMerge className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {error && <p className="px-3 py-2 text-rose-600">{error}</p>}
        {!error && !isLoading && !structure && <p className="px-3 py-2 text-slate-400">세그먼트 분석 결과가 없습니다.</p>}
        {segmentsByPage.map(([page, pageSegments]) => (
          <section key={page} className="mb-3">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Page {page}
            </div>
            {pageSegments.map((segment) => (
              <div
                key={segment.id}
                onDragOver={(event) => isEditMode && event.preventDefault()}
                onDrop={() => {
                  if (dragTarget && dragTarget.target.page === segment.page) {
                    onAssign(dragTarget.kind, dragTarget.target.id, segment.id);
                  }
                  setDragTarget(null);
                }}
                className={`mx-2 mb-2 rounded border ${(selectedSegmentId === segment.id || mergeCandidates.includes(segment.id)) ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'}`}
              >
                <button
                  onClick={(event) => {
                    if (isEditMode && event.shiftKey) {
                      setMergeCandidates((prev) => prev.includes(segment.id)
                        ? prev.filter((id) => id !== segment.id)
                        : [...prev, segment.id]);
                      return;
                    }
                    setMergeCandidates([]);
                    onSelectSegment(segment);
                  }}
                  className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-slate-50"
                >
                  <Box className="w-3.5 h-3.5 text-violet-500" />
                  <span className="flex-1 truncate font-medium">{segment.label}</span>
                  <span className="font-mono text-[10px] text-slate-400">{segment.type}</span>
                </button>
                <TargetList
                  items={mapped.bySegment.get(segment.id) || []}
                  editable={isEditMode}
                  onDragStart={setDragTarget}
                  onSelect={selectTarget}
                  onUnassign={(item) => onAssign(item.kind, item.target.id, null)}
                />
              </div>
            ))}
          </section>
        ))}

        {mapped.unassigned.length > 0 && (
          <div className="mx-2 mt-3 rounded border border-dashed border-slate-300">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500">UNASSIGNED</div>
            <TargetList
              items={mapped.unassigned}
              editable={isEditMode}
              onDragStart={setDragTarget}
              onSelect={selectTarget}
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
  onDragStart: (item: DragTarget) => void;
  onSelect: (item: DragTarget) => void;
  onUnassign?: (item: DragTarget) => void;
}

function TargetList({ items, editable, onDragStart, onSelect, onUnassign }: TargetListProps) {
  return items.map((item) => {
    const Icon = item.kind === 'outline_element' ? FileText : Table2;
    return (
      <div
        key={`${item.kind}:${item.target.id}`}
        draggable={editable}
        onDragStart={() => onDragStart(item)}
        onClick={() => onSelect(item)}
        className="group px-2 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 text-slate-600"
      >
        {editable && <GripVertical className="w-3 h-3 text-slate-300" />}
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="flex-1 truncate">{item.target.label}</span>
        {editable && onUnassign && (
          <button onClick={(event) => { event.stopPropagation(); onUnassign(item); }} title="관계 해제">
            <Unlink className="w-3 h-3 text-slate-400 hover:text-rose-500" />
          </button>
        )}
      </div>
    );
  });
}
