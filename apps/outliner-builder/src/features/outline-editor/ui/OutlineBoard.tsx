/**
 * @file OutlineBoard.tsx
 * @description Workflowy 사양의 무한 아웃라인 트리 ➔ 2차원 칸반 보드 뷰 컴포넌트
 *
 * 사양 규칙 (Workflowy 동일):
 * 1. 현재 줌(activeRootId) 기준 1단계 직계 불릿 = 컬럼(Column)
 * 2. 각 컬럼의 직계 자식 불릿 = 카드(Card)
 * 3. 카드의 하위 불릿 = 카드 내부의 종속 아웃라인(Nested Sub-bullets)으로 관리
 *
 * 마우스 조작:
 * - 카드의 불릿 점을 잡고 끌면 카드 이동 (다른 카드의 위/아래, 다른 컬럼의 빈 곳)
 * - 컬럼 머리의 아이콘을 잡고 끌면 컬럼 순서 변경
 * - 컬럼 오른쪽 가장자리를 끌면 컬럼 폭 조절 (이번 접속 동안만 유지)
 */

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Maximize2,
  FolderTree,
} from 'lucide-react';
import {
  type NodeId,
  type OutlineNode,
  type BoardColumn,
  toBoardViewModel,
} from '@vibe/outliner-core';
import { useActiveProject, useWorkspaceStore } from '@/entities/workspace';
import { type BoardDnd, useBoardDragAndDrop } from '../model/useBoardDragAndDrop';

const DEFAULT_COLUMN_WIDTH = 288;
const MIN_COLUMN_WIDTH = 200;
const MAX_COLUMN_WIDTH = 640;

// ==========================================
// 1. 카드 내부 종속 하위 불릿 뷰 (Recursive Sub-bullets)
// ==========================================
interface SubBulletRowProps {
  node: OutlineNode;
  depth: number;
  onUpdateText: (id: NodeId, text: string) => void;
  onDeleteNode: (id: NodeId) => void;
  onAddChild: (parentId: NodeId) => void;
  onZoom: (id: NodeId) => void;
}

const SubBulletRow: React.FC<SubBulletRowProps> = ({
  node,
  depth,
  onUpdateText,
  onDeleteNode,
  onAddChild,
  onZoom,
}) => {
  const [isFolded, setIsFolded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col space-y-1">
      <div
        className="group/sub flex items-center gap-1.5 py-0.5 rounded hover:bg-slate-800/40 px-1 transition-colors"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {/* 접기/펼치기 또는 불릿 점 */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsFolded(!isFolded)}
            className="w-3.5 h-3.5 flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-pointer shrink-0"
          >
            {isFolded ? (
              <ChevronRight className="w-3 h-3 text-indigo-400" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onZoom(node.id)}
            title="이 불릿으로 줌인"
            className="w-3.5 h-3.5 flex items-center justify-center text-slate-600 hover:text-indigo-400 cursor-pointer shrink-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 hover:bg-indigo-400 transition-colors" />
          </button>
        )}

        {/* 텍스트 인라인 편집 */}
        <input
          type="text"
          value={node.text}
          onChange={(e) => onUpdateText(node.id, e.target.value)}
          placeholder="하위 항목..."
          className="flex-1 min-w-0 bg-transparent text-[11px] text-slate-300 hover:text-slate-100 focus:text-slate-100 hover:bg-slate-900/60 focus:bg-slate-950 px-1 py-0.5 rounded border border-transparent focus:border-indigo-500/60 focus:outline-hidden transition-all truncate"
        />

        {/* 호버 액션: 자식 추가 & 삭제 */}
        <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            title="하위 불릿 추가"
            className="p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700/60"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteNode(node.id)}
            title="삭제"
            className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/60"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 중첩 하위 트리 (접히지 않았을 때) */}
      {!isFolded &&
        hasChildren &&
        node.children.map((child) => (
          <SubBulletRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onUpdateText={onUpdateText}
            onDeleteNode={onDeleteNode}
            onAddChild={onAddChild}
            onZoom={onZoom}
          />
        ))}
    </div>
  );
};

// ==========================================
// 2. 개별 카드 뷰 (Board Card)
// ==========================================
interface BoardCardViewProps {
  card: OutlineNode;
  dnd: BoardDnd;
  onUpdateText: (id: NodeId, text: string) => void;
  onDeleteCard: (id: NodeId) => void;
  onAddSubBullet: (cardId: NodeId) => void;
  onZoom: (id: NodeId) => void;
}

const BoardCardView: React.FC<BoardCardViewProps> = ({
  card,
  dnd,
  onUpdateText,
  onDeleteCard,
  onAddSubBullet,
  onZoom,
}) => {
  const hasSubBullets = card.children.length > 0;
  const isDragging = dnd.dragging?.kind === 'card' && dnd.dragging.id === card.id;
  const dropPosition = dnd.dropTarget?.targetId === card.id ? dnd.dropTarget.position : null;

  return (
    <div
      data-board-card
      onDragOver={(e) => dnd.overCard(e, card.id)}
      onDrop={dnd.drop}
      className={`group/card relative bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col space-y-1.5 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {/* 끌어 놓을 자리 표시 (이 카드의 위 또는 아래) */}
      {dropPosition && (
        <div
          className={`absolute left-0 right-0 h-[2px] rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] pointer-events-none ${
            dropPosition === 'before' ? '-top-[5px]' : '-bottom-[5px]'
          }`}
        />
      )}
      {/* 카드 헤더 (불릿 점 + 제목 + 액션) */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 flex-1 min-w-0 pt-0.5">
          {/* 카드 불릿 점 (클릭 시 카드로 줌인, 잡고 끌면 카드 이동) */}
          <button
            type="button"
            draggable
            onDragStart={(e) => dnd.startDrag(e, 'card', card.id)}
            onDragEnd={dnd.endDrag}
            onClick={() => onZoom(card.id)}
            title="클릭: 이 카드로 줌인 · 끌기: 카드 이동"
            className="w-4 h-4 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-400 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 mt-0.5 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-slate-400 group-hover/card:bg-indigo-400 transition-colors" />
          </button>

          {/* 카드 메인 텍스트 인라인 편집 */}
          <textarea
            rows={1}
            value={card.text}
            onChange={(e) => onUpdateText(card.id, e.target.value)}
            placeholder="카드 내용..."
            className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-200 placeholder:text-slate-600 hover:bg-slate-900/60 focus:bg-slate-900 px-1.5 py-0.5 rounded border border-transparent focus:border-indigo-500 focus:outline-hidden transition-all resize-none leading-relaxed"
          />
        </div>

        {/* 카드 호버 액션 */}
        <div className="opacity-0 group-hover/card:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            type="button"
            onClick={() => onAddSubBullet(card.id)}
            title="카드 내부 하위 불릿 추가"
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onZoom(card.id)}
            title="카드로 줌인"
            className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteCard(card.id)}
            title="카드 삭제"
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 카드 하위 종속 불릿 트리 (Level 3+) */}
      {hasSubBullets && (
        <div className="mt-1 pt-1.5 border-t border-slate-900/80 space-y-0.5 pl-1">
          {card.children.map((child) => (
            <SubBulletRow
              key={child.id}
              node={child}
              depth={0}
              onUpdateText={onUpdateText}
              onDeleteNode={onDeleteCard}
              onAddChild={onAddSubBullet}
              onZoom={onZoom}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. 개별 컬럼 뷰 (Board Column)
// ==========================================
interface BoardColumnViewProps {
  column: BoardColumn;
  dnd: BoardDnd;
  width: number;
  onResizeStart: (e: React.MouseEvent<HTMLElement>, columnId: NodeId) => void;
  onUpdateTitle: (id: NodeId, text: string) => void;
  onDeleteColumn: (id: NodeId) => void;
  onAddCard: (colId: NodeId) => void;
  onUpdateCardText: (id: NodeId, text: string) => void;
  onDeleteCard: (id: NodeId) => void;
  onAddSubBullet: (parentId: NodeId) => void;
  onZoom: (id: NodeId) => void;
}

const BoardColumnView: React.FC<BoardColumnViewProps> = ({
  column,
  dnd,
  width,
  onResizeStart,
  onUpdateTitle,
  onDeleteColumn,
  onAddCard,
  onUpdateCardText,
  onDeleteCard,
  onAddSubBullet,
  onZoom,
}) => {
  const isDragging = dnd.dragging?.kind === 'column' && dnd.dragging.id === column.id;
  const dropPosition = dnd.dropTarget?.targetId === column.id ? dnd.dropTarget.position : null;

  return (
    <div
      data-board-column
      style={{ width }}
      onDragOver={(e) => dnd.overColumn(e, column.id)}
      onDrop={dnd.drop}
      className={`relative shrink-0 bg-slate-900/60 border rounded-xl p-3 flex flex-col max-h-[calc(100vh-220px)] shadow-lg backdrop-blur-xs select-none transition-colors ${
        dropPosition === 'inside' ? 'border-indigo-500/70 bg-indigo-950/20' : 'border-slate-800/80'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* 끌어 놓을 자리 표시 (이 컬럼의 왼쪽 또는 오른쪽) */}
      {(dropPosition === 'before' || dropPosition === 'after') && (
        <div
          className={`absolute top-0 bottom-0 w-[2px] rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] pointer-events-none ${
            dropPosition === 'before' ? '-left-[9px]' : '-right-[9px]'
          }`}
        />
      )}

      {/* 컬럼 폭 조절 손잡이 */}
      <div
        onMouseDown={(e) => onResizeStart(e, column.id)}
        className="absolute top-2 bottom-2 -right-[5px] w-[9px] cursor-col-resize z-10 group/resize"
        title="끌어서 컬럼 폭 조절"
      >
        <div className="mx-auto w-[2px] h-full rounded-full bg-transparent group-hover/resize:bg-indigo-500/60 transition-colors" />
      </div>

      {/* 컬럼 헤더 (1단계 직계 불릿) */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* 컬럼 불릿 점 (클릭 시 컬럼 안으로 줌인, 잡고 끌면 컬럼 순서 변경) */}
          <button
            type="button"
            draggable
            onDragStart={(e) => dnd.startDrag(e, 'column', column.id)}
            onDragEnd={dnd.endDrag}
            onClick={() => onZoom(column.id)}
            title={`클릭: '${column.title}' 컬럼으로 줌인 · 끌기: 컬럼 이동`}
            className="w-5 h-5 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-400 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-400/80 hover:text-indigo-300" />
          </button>

          {/* 컬럼 제목 인라인 편집 */}
          <input
            type="text"
            value={column.title}
            onChange={(e) => onUpdateTitle(column.id, e.target.value)}
            placeholder="컬럼 제목..."
            className="text-xs font-bold text-slate-100 bg-transparent hover:bg-slate-800/60 focus:bg-slate-950 px-1.5 py-0.5 rounded border border-transparent focus:border-indigo-500 focus:outline-hidden transition-all truncate flex-1 min-w-0"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 카드 수 뱃지 */}
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
            {column.cards.length}
          </span>

          {/* 컬럼 삭제 액션 */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`'${column.title}' 컬럼과 내부 카드들을 모두 삭제하시겠습니까?`)) {
                onDeleteColumn(column.id);
              }
            }}
            title="컬럼 삭제"
            className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 컬럼 내부 카드 리스트 (2단계 직계 불릿들) */}
      <div
        className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 min-h-[50px]"
        onDragOver={(e) => dnd.overColumnBody(e, column.id)}
        onDrop={dnd.drop}
      >
        {column.cards.map((card) => (
          <BoardCardView
            key={card.id}
            card={card}
            dnd={dnd}
            onUpdateText={onUpdateCardText}
            onDeleteCard={onDeleteCard}
            onAddSubBullet={onAddSubBullet}
            onZoom={onZoom}
          />
        ))}

        {column.cards.length === 0 && (
          <div className="py-8 text-center text-[11px] text-slate-600 border border-dashed border-slate-800/60 rounded-lg">
            카드가 없습니다
          </div>
        )}
      </div>

      {/* 카드 추가 버튼 */}
      <div className="pt-2 border-t border-slate-800/60 mt-2 shrink-0">
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>카드 추가</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. 메인 OutlineBoard 컨테이너
// ==========================================
export const OutlineBoard: React.FC = () => {
  const rootNodes = useActiveProject().rootNodes;
  const activeRootId = useWorkspaceStore((s) => s.activeRootId);
  const appendChild = useWorkspaceStore((s) => s.appendChild);
  const addBulletAtEnd = useWorkspaceStore((s) => s.addBulletAtEnd);
  const updateText = useWorkspaceStore((s) => s.updateText);
  const deleteNode = useWorkspaceStore((s) => s.deleteNode);
  const setZoom = useWorkspaceStore((s) => s.setZoom);
  const dnd = useBoardDragAndDrop();
  // 컬럼 폭은 보기 설정일 뿐이라 파일에 저장하지 않는다. (이번 접속 동안만 유지)
  const [columnWidths, setColumnWidths] = useState<Record<NodeId, number>>({});

  const handleResizeStart = (e: React.MouseEvent<HTMLElement>, columnId: NodeId) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTH;

    const handleMove = (ev: MouseEvent) => {
      const next = Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(MAX_COLUMN_WIDTH, startWidth + ev.clientX - startX)
      );
      setColumnWidths((widths) => ({ ...widths, [columnId]: next }));
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Workflowy 사양: 기준 줌 노드의 1단계 불릿들을 컬럼으로 투영
  const boardView = React.useMemo(() => {
    return toBoardViewModel(rootNodes, activeRootId);
  }, [rootNodes, activeRootId]);

  const handleAddColumn = () => {
    // 줌 상태이면 그 불릿의 하위 끝에, 아니면 맨 위 단계 끝에 추가
    const createdId = addBulletAtEnd();
    if (createdId) updateText(createdId, '새 컬럼');
  };

  const handleAddCard = (colId: NodeId) => {
    appendChild(colId, '');
  };

  const handleAddSubBullet = (parentId: NodeId) => {
    appendChild(parentId, '');
  };

  if (boardView.columns.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-indigo-400 shadow-inner">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">보드 컬럼이 없습니다</h3>
        <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
          Workflowy 사양: 현재 위치의 직계 불릿들이 가로 컬럼이 되고, 그 하위 불릿들이 카드가 됩니다.
        </p>
        <button
          type="button"
          onClick={handleAddColumn}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-900/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>첫 번째 컬럼 추가</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start select-none min-h-[400px]">
      {boardView.columns.map((column) => (
        <BoardColumnView
          key={column.id}
          column={column}
          dnd={dnd}
          width={columnWidths[column.id] ?? DEFAULT_COLUMN_WIDTH}
          onResizeStart={handleResizeStart}
          onUpdateTitle={(id, text) => updateText(id, text)}
          onDeleteColumn={(id) => deleteNode(id)}
          onAddCard={handleAddCard}
          onUpdateCardText={(id, text) => updateText(id, text)}
          onDeleteCard={(id) => deleteNode(id)}
          onAddSubBullet={handleAddSubBullet}
          onZoom={(id) => setZoom(id)}
        />
      ))}

      {/* + 새 컬럼 추가 버튼 (보드 맨 우측) */}
      <div className="w-72 shrink-0">
        <button
          type="button"
          onClick={handleAddColumn}
          className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-slate-900/70 text-slate-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>새 컬럼 추가</span>
        </button>
      </div>
    </div>
  );
};
