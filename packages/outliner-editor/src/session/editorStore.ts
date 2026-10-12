/**
 * @file editorStore.ts
 * @description 편집 화면 하나의 상태와 불릿 편집 액션 (호스트 비의존)
 *
 * 편집 화면은 스캐폴드 하나만 안다. 불릿 트리 자체는 이 스토어가 갖지 않고,
 * 호스트가 넘겨준 문서 창구(`OutlineDocumentPort`)로 읽고 쓴다. 그래서 데이터의 주인은 언제나 호스트 하나다.
 * 이 스토어가 직접 갖는 것은 파일에 저장되지 않는 화면 상태(줌·포커스·캐럿·선택)뿐이다.
 *
 * 독립 앱은 앱 전체에 하나, 옵시디언 플러그인은 탭마다 하나씩 만든다.
 */

import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  type DropPosition,
  type NodeId,
  type OutlineNode,
  type OutlineNodeType,
  type ViewMode,
  insertAfter,
  appendChild,
  indentNode,
  outdentNode,
  deleteNode,
  updateNodeText,
  toggleFold,
  toggleNodesCompleted,
  setNodeNote,
  deleteNodes,
  moveNodes,
  duplicateNodes,
  duplicateNodesTo,
  setFoldDeep,
  setNodesType,
  setNodesViewMode,
  findNode,
  generateNodeId,
} from '@vibe/outliner-core';

/** 호스트가 제공하는 문서 창구: 지금 스캐폴드의 불릿 트리를 읽고, 바꾼 트리를 돌려준다. */
export interface OutlineDocumentPort {
  getRoots: () => OutlineNode[];
  commitRoots: (roots: OutlineNode[]) => void;
  /** 스캐폴드의 기본 보기 방식(불릿/보드)을 바꾼다. */
  setDefaultView: (view: ViewMode) => void;
}

/** 파일에 저장되지 않는 편집 화면 상태 (줌·포커스·캐럿·선택) */
export interface EditorViewState {
  activeRootId: NodeId | null; // 줌인된 루트 노드 ID
  focusedNodeId: NodeId | null; // 현재 포커스 대상 노드 ID
  targetCaretOffset: number | null; // 포커스 복원 시 캐럿 위치
  noteEditingNodeId: NodeId | null; // 노트 입력 칸을 열어 포커스할 노드 ID
  selectedNodeIds: NodeId[]; // 마우스로 여러 개 고른 불릿 (묶음 조작 대상)
}

export interface OutlineEditorState extends EditorViewState {
  getRoots: () => OutlineNode[];
  setDefaultView: (view: ViewMode) => void;
  /** 다른 스캐폴드로 바뀌었을 때 화면 상태를 처음으로 되돌린다. */
  resetView: () => void;

  insertAfter: (targetId: NodeId, text?: string) => NodeId | null;
  appendChild: (parentId: NodeId, text?: string) => NodeId | null;
  indent: (targetId: NodeId) => boolean;
  outdent: (targetId: NodeId) => boolean;
  deleteNode: (targetId: NodeId) => boolean;
  updateText: (targetId: NodeId, text: string) => void;
  toggleFold: (targetId: NodeId) => void;
  setFoldDeep: (targetId: NodeId, isFolded: boolean) => void;
  addBulletAtEnd: () => NodeId | null;
  moveNodes: (sourceIds: NodeId[], targetId: NodeId | null, position: DropPosition) => boolean;
  duplicateNodes: (sourceIds: NodeId[]) => NodeId[];
  duplicateNodesTo: (
    sourceIds: NodeId[],
    targetId: NodeId | null,
    position: DropPosition
  ) => boolean;
  deleteNodes: (targetIds: NodeId[]) => boolean;
  setNodesType: (targetIds: NodeId[], nodeType: OutlineNodeType) => void;
  setNodesViewMode: (targetIds: NodeId[], viewMode: ViewMode | undefined) => void;
  setNodesCompleted: (targetIds: NodeId[]) => void;
  selectNodes: (nodeIds: NodeId[]) => void;
  clearSelection: () => void;
  toggleCompleted: (targetId: NodeId) => void;
  setNote: (targetId: NodeId, note: string) => void;
  startNoteEdit: (nodeId: NodeId) => void;
  endNoteEdit: () => void;
  setZoom: (nodeId: NodeId | null) => void;
  setFocus: (nodeId: NodeId | null, caretOffset?: number) => void;
}

export type OutlineEditorStore = StoreApi<OutlineEditorState>;

const RESET_EDITOR_VIEW: EditorViewState = {
  activeRootId: null,
  focusedNodeId: null,
  targetCaretOffset: null,
  noteEditingNodeId: null,
  selectedNodeIds: [],
};

export function createOutlineEditorStore(document: OutlineDocumentPort): OutlineEditorStore {
  return createStore<OutlineEditorState>((set, get) => {
    const roots = () => document.getRoots();

    /** 불릿 트리를 바꾸는 유일한 길. 바꾼 트리는 호스트에 돌려주고, 화면 상태만 여기서 고친다. */
    const commit = (nextRoots: OutlineNode[], view: Partial<EditorViewState> = {}): boolean => {
      document.commitRoots(nextRoots);
      if (Object.keys(view).length > 0) set(view);
      return true;
    };

    return {
      ...RESET_EDITOR_VIEW,

      getRoots: roots,
      setDefaultView: (view) => document.setDefaultView(view),
      resetView: () => set(RESET_EDITOR_VIEW),

      insertAfter: (targetId, text = '') => {
        const { newNodes, createdNode } = insertAfter(roots(), targetId, text);
        commit(newNodes, { focusedNodeId: createdNode.id, targetCaretOffset: 0 });
        return createdNode.id;
      },

      appendChild: (parentId, text = '') => {
        const { newNodes, createdNode } = appendChild(roots(), parentId, text);
        commit(newNodes, { focusedNodeId: createdNode.id, targetCaretOffset: 0 });
        return createdNode.id;
      },

      indent: (targetId) => {
        const res = indentNode(roots(), targetId);
        if (!res.success) return false;
        return commit(res.newNodes, { focusedNodeId: targetId });
      },

      outdent: (targetId) => {
        const res = outdentNode(roots(), targetId);
        if (!res.success) return false;
        return commit(res.newNodes, { focusedNodeId: targetId });
      },

      deleteNode: (targetId) => {
        const res = deleteNode(roots(), targetId);
        if (!res.success) return false;
        return commit(res.newNodes);
      },

      updateText: (targetId, text) => {
        const res = updateNodeText(roots(), targetId, text);
        if (!res.success) return;
        commit(res.newNodes);
      },

      toggleFold: (targetId) => {
        const res = toggleFold(roots(), targetId);
        if (!res.success) return;
        commit(res.newNodes);
      },

      setFoldDeep: (targetId, isFolded) => {
        const res = setFoldDeep(roots(), targetId, isFolded);
        if (!res.success) return;
        commit(res.newNodes);
      },

      // 지금 보고 있는 범위(줌인했으면 그 불릿의 하위, 아니면 맨 위 단계)의 끝에 새 불릿을 만든다.
      addBulletAtEnd: () => {
        const { activeRootId } = get();
        const current = roots();
        if (activeRootId && findNode(current, activeRootId)) {
          return get().appendChild(activeRootId, '');
        }
        if (current.length > 0) {
          return get().insertAfter(current[current.length - 1].id, '');
        }
        const now = Date.now();
        const node: OutlineNode = {
          id: generateNodeId(),
          text: '',
          children: [],
          createdAt: now,
          updatedAt: now,
        };
        commit([node], { focusedNodeId: node.id, targetCaretOffset: 0 });
        return node.id;
      },

      moveNodes: (sourceIds, targetId, position) => {
        const res = moveNodes(roots(), sourceIds, targetId, position);
        if (!res.success) return false;
        return commit(res.newNodes);
      },

      duplicateNodes: (sourceIds) => {
        const res = duplicateNodes(roots(), sourceIds);
        if (res.createdIds.length === 0) return [];
        commit(res.newNodes, { selectedNodeIds: [] });
        return res.createdIds;
      },

      duplicateNodesTo: (sourceIds, targetId, position) => {
        const res = duplicateNodesTo(roots(), sourceIds, targetId, position);
        if (!res.success) return false;
        return commit(res.newNodes, { selectedNodeIds: [] });
      },

      deleteNodes: (targetIds) => {
        const res = deleteNodes(roots(), targetIds);
        if (res.count === 0) return false;
        return commit(res.newNodes, { selectedNodeIds: [] });
      },

      // 종류를 바꾸면 "보드로 보기" 지정은 풀린다. (보드는 종류가 아니라 보기 방식이다)
      setNodesType: (targetIds, nodeType) => {
        const typed = setNodesType(roots(), targetIds, nodeType);
        const res = setNodesViewMode(typed.newNodes, targetIds, undefined);
        if (typed.count === 0 && res.count === 0) return;
        commit(res.newNodes);
      },

      setNodesViewMode: (targetIds, viewMode) => {
        const res = setNodesViewMode(roots(), targetIds, viewMode);
        if (res.count === 0) return;
        commit(res.newNodes);
      },

      // 고른 것 중 하나라도 미완료면 모두 완료로, 모두 완료면 모두 미완료로 바꾼다.
      setNodesCompleted: (targetIds) => {
        const current = roots();
        const allCompleted = targetIds.every((id) => findNode(current, id)?.isCompleted === true);
        const res = toggleNodesCompleted(current, targetIds, !allCompleted);
        if (res.count === 0) return;
        commit(res.newNodes);
      },

      selectNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),
      clearSelection: () => {
        if (get().selectedNodeIds.length > 0) set({ selectedNodeIds: [] });
      },

      toggleCompleted: (targetId) => {
        const res = toggleNodesCompleted(roots(), [targetId]);
        if (res.count === 0) return;
        commit(res.newNodes);
      },

      setNote: (targetId, note) => {
        const res = setNodeNote(roots(), targetId, note);
        if (!res.success) return;
        commit(res.newNodes);
      },

      startNoteEdit: (nodeId) => set({ noteEditingNodeId: nodeId }),
      endNoteEdit: () => set({ noteEditingNodeId: null }),

      setZoom: (nodeId) =>
        set({
          activeRootId: nodeId,
          focusedNodeId: nodeId,
        }),

      // 불릿 글자를 고치기 시작하면 묶음 선택은 푼다. 포커스를 떼는 것(null)만으로는 풀지 않는다.
      // (여러 줄을 끌어 고를 때 입력칸의 포커스가 떨어지는데, 그때 방금 고른 선택이 지워지면 안 된다)
      setFocus: (nodeId, caretOffset) =>
        set({
          focusedNodeId: nodeId,
          targetCaretOffset: nodeId && caretOffset !== undefined ? caretOffset : null,
          ...(nodeId ? { selectedNodeIds: [] } : {}),
        }),
    };
  });
}
