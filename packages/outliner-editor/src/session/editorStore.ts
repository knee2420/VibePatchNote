/**
 * @file editorStore.ts
 * @description 편집 화면 하나의 상태와 불릿 편집 액션 (호스트 비의존)
 *
 * 편집 화면은 스캐폴드 하나만 안다. 불릿 트리는 호스트가 넘겨준 문서 창구(`OutlineDocumentPort`)로 읽고 쓴다.
 * 그래서 저장되는 데이터의 주인은 언제나 호스트 하나다.
 *
 * 편집하는 동안에는 호스트의 중첩 트리를 ID 트리로 올려 두고, 모든 편집을 패치 엔진(`applyPatch`)으로 한다.
 * 바뀐 결과는 중첩 트리로 내려 호스트에 돌려준다. 이 스토어가 직접 갖는 것은
 * 파일에 저장되지 않는 화면 상태(줌·포커스·캐럿·선택)와 실행 취소 기록뿐이다.
 *
 * 실행 취소는 일반 편집기처럼 동작한다.
 * - 사용자가 한 번 한 동작은 한 번에 되돌아간다. (여러 요청을 `batch` 로 묶으면 한 동작이다)
 * - 바뀐 것이 없으면 기록하지 않는다.
 * - 접기·펼치기는 화면 상태라 기록하지 않고, 되돌릴 때에도 지금 접어 둔 모양을 유지한다.
 * - 밖에서 파일이 바뀌면(다른 화면의 편집, 파일 다시 읽기) 기록을 비운다. 예전 트리로 덮어쓰지 않기 위해서다.
 *
 * 독립 앱은 앱 전체에 하나, 옵시디언 플러그인은 탭마다 하나씩 만든다.
 */

import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  type DropPosition,
  type FlatNode,
  type FlatNodeInput,
  type FlatOutlineTree,
  type NodeId,
  type OutlineNode,
  type OutlineNodeType,
  type TreePatchRequest,
  type TreePatchResult,
  type TreeProjection,
  type ViewMode,
  ROOT_ID,
  applyPatch as runPatch,
  getFlatNode,
  getTopmostIds,
  importTree,
  indentRequests,
  insertRequests,
  isInSubtree,
  moveRequests,
  outdentRequests,
  projectTree,
  subtreeInput,
  toNodeInputs,
  withFoldStateOf,
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

/** 실행 취소/다시 실행을 위한 기록 한 칸: 그 동작 직전의 트리와 화면 상태 */
export interface HistorySnapshot {
  tree: FlatOutlineTree;
  view: EditorViewState;
}

export interface OutlineEditorState extends EditorViewState {
  getRoots: () => OutlineNode[];
  /** 지금의 ID 트리. 노드를 id 로 바로 찾을 때 쓴다. */
  getTree: () => FlatOutlineTree;
  setDefaultView: (view: ViewMode) => void;
  /** 다른 스캐폴드로 바뀌었을 때 화면 상태와 실행 취소 기록을 처음으로 되돌린다. */
  resetView: () => void;

  /** 패치 요청을 그대로 적용한다. 이 호출 하나가 실행 취소 한 번이다. 요청마다의 결과를 돌려준다. */
  applyPatch: (requests: TreePatchRequest[], view?: Partial<EditorViewState>) => TreePatchResult[];
  /** 여러 편집을 한 동작으로 묶는다. 묶음 전체가 실행 취소 한 번이고, 호스트에는 한 번만 돌려준다. */
  batch: <T>(fn: (state: OutlineEditorState) => T) => T;

  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;

  insertAfter: (targetId: NodeId, text?: string) => NodeId | null;
  insertNodes: (targetId: NodeId | null, nodes: OutlineNode[]) => NodeId[];
  replaceNodes: (targetIds: NodeId[], nodes: OutlineNode[]) => NodeId[];
  appendChild: (parentId: NodeId, text?: string) => NodeId | null;
  /** Enter: 불릿의 글자를 캐럿에서 나눠, 뒷부분으로 바로 아래에 새 불릿을 만든다. */
  splitNode: (targetId: NodeId, before: string, after: string) => NodeId | null;
  /**
   * 글자 맨 앞에서 Backspace: 이 불릿을 지우고 윗줄의 글자를 `mergedText` 로 바꾼다.
   * 하위가 있는 불릿은 지우지 않는다. (하위까지 말없이 사라지면 안 된다)
   */
  joinWithPrevious: (
    targetId: NodeId,
    previousId: NodeId,
    mergedText: string,
    caretOffset: number
  ) => boolean;
  indent: (targetId: NodeId) => boolean;
  indentNodes: (targetIds: NodeId[]) => boolean;
  outdent: (targetId: NodeId) => boolean;
  outdentNodes: (targetIds: NodeId[]) => boolean;
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
  /** 파일들을 붙인다. 붙인 불릿들의 id 를 돌려준다. */
  attachFiles: (targetId: NodeId, targets: string[]) => NodeId[];
  detachFile: (targetId: NodeId) => void;
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

const MAX_HISTORY = 100;
/** 같은 불릿에 이 간격 안으로 이어 친 글자는 실행 취소 한 번으로 묶는다. */
const TYPING_MERGE_MS = 800;

/** 호스트의 중첩 트리를 ID 트리로 올려 둔 것. 호스트가 돌려준 트리가 그대로인 동안만 유효하다. */
interface Session {
  hostRoots: OutlineNode[];
  tree: FlatOutlineTree;
  projection: TreeProjection;
}

/** 진행 중인 한 동작. 끝날 때 한 번만 기록하고 한 번만 호스트에 돌려준다. */
interface Transaction {
  tree: FlatOutlineTree;
  view: Partial<EditorViewState>;
  /** 접기·펼치기 말고 다른 것이 바뀌었는지 (접기만 바뀌었으면 기록하지 않는다) */
  edited: boolean;
  /** 글자 한 곳만 고친 동작이면 그 불릿 (이어 친 글자를 묶는 데 쓴다) */
  typingIn: NodeId | null;
}

const createdIdsOf = (result: TreePatchResult | undefined): NodeId[] =>
  result?.ok ? (result.createdIds ?? []) : [];

/** 두 글자의 달라진 구간이 `text` 안에서 끝나는 자리. 되돌린 뒤 캐럿을 둘 곳이다. */
function changeEnd(text: string, other: string): number {
  let suffix = 0;
  const limit = Math.min(text.length, other.length);
  while (suffix < limit && text[text.length - 1 - suffix] === other[other.length - 1 - suffix]) {
    suffix++;
  }
  return text.length - suffix;
}

export function createOutlineEditorStore(document: OutlineDocumentPort): OutlineEditorStore {
  return createStore<OutlineEditorState>((set, get) => {
    let session: Session | null = null;
    let transaction: Transaction | null = null;
    const past: HistorySnapshot[] = [];
    const future: HistorySnapshot[] = [];
    let lastTyping: { targetId: NodeId; at: number } | null = null;

    const clearHistory = () => {
      past.length = 0;
      future.length = 0;
      lastTyping = null;
    };

    /** 호스트의 지금 트리에 맞는 세션. 밖에서 트리가 바뀌었으면 다시 올리고 기록을 비운다. */
    const sync = (): Session => {
      const hostRoots = document.getRoots();
      if (!session || session.hostRoots !== hostRoots) {
        session = { hostRoots, ...importTree(hostRoots) };
        clearHistory();
      }
      return session;
    };

    const currentTree = (): FlatOutlineTree => transaction?.tree ?? sync().tree;
    const nodeOf = (id: NodeId): FlatNode | undefined => getFlatNode(currentTree(), id);

    const currentView = (): EditorViewState => {
      const state = get();
      return {
        activeRootId: state.activeRootId,
        focusedNodeId: state.focusedNodeId,
        targetCaretOffset: state.targetCaretOffset,
        noteEditingNodeId: state.noteEditingNodeId,
        selectedNodeIds: state.selectedNodeIds,
      };
    };

    /** 바뀐 트리를 중첩 꼴로 내려 호스트에 돌려준다. 호스트에 트리를 넘기는 유일한 곳. */
    const publish = (tree: FlatOutlineTree) => {
      const projection = projectTree(tree, sync().projection);
      session = { hostRoots: projection.roots, tree, projection };
      document.commitRoots(projection.roots);
    };

    /** 화면 상태를 바꾼다. 동작 중이면 바뀐 트리가 호스트에 돌아간 뒤에 한꺼번에 반영한다. */
    const setView = (view: Partial<EditorViewState>) => {
      if (transaction) Object.assign(transaction.view, view);
      else set(view);
    };

    const remember = (stack: HistorySnapshot[], snapshot: HistorySnapshot) => {
      stack.push(snapshot);
      if (stack.length > MAX_HISTORY) stack.shift();
    };

    /**
     * 한 동작을 실행한다. 안에서 한 모든 편집을 끝날 때 한 번에 기록하고 돌려준다.
     * 이미 동작 중이면 그 동작에 합쳐진다.
     */
    const transact = <T>(fn: () => T): T => {
      if (transaction) return fn();

      const startTree = sync().tree;
      const startView = currentView();
      const running: Transaction = { tree: startTree, view: {}, edited: false, typingIn: null };
      transaction = running;
      try {
        return fn();
      } finally {
        transaction = null;
        if (running.tree !== startTree) {
          const now = Date.now();
          if (running.edited) {
            const continuesTyping =
              running.typingIn !== null &&
              lastTyping !== null &&
              lastTyping.targetId === running.typingIn &&
              now - lastTyping.at < TYPING_MERGE_MS;
            if (!continuesTyping) {
              remember(past, { tree: startTree, view: startView });
              future.length = 0;
            }
            lastTyping = running.typingIn ? { targetId: running.typingIn, at: now } : null;
          }
          publish(running.tree);
        }
        if (Object.keys(running.view).length > 0) set(running.view);
      }
    };

    /** 패치 요청을 지금 동작에 적용한다. 불릿 트리를 바꾸는 유일한 길. */
    const apply = (
      requests: TreePatchRequest[],
      view: Partial<EditorViewState> = {},
      typingIn: NodeId | null = null
    ): TreePatchResult[] =>
      transact(() => {
        const running = transaction!;
        const outcome = runPatch(running.tree, requests);
        if (outcome.tree !== running.tree) {
          if (requests.some((request) => request.op !== 'set_fold')) {
            running.typingIn = running.edited ? null : typingIn;
            running.edited = true;
          }
          running.tree = outcome.tree;
        }
        Object.assign(running.view, view);
        return outcome.results;
      });

    /** 기록해 둔 트리로 돌아간다. (실행 취소·다시 실행 공통) */
    const restore = (from: HistorySnapshot[], to: HistorySnapshot[]): boolean => {
      if (transaction) return false;
      const current = sync();
      const snapshot = from.pop();
      if (!snapshot) return false;

      remember(to, { tree: current.tree, view: currentView() });
      lastTyping = null;

      const tree = withFoldStateOf(snapshot.tree, current.tree);
      const view = { ...snapshot.view };
      // 포커스한 불릿의 글자가 달라졌으면 캐럿을 바뀐 곳 끝에 둔다.
      const focusedId = view.focusedNodeId;
      const restored = focusedId ? getFlatNode(tree, focusedId) : undefined;
      const replaced = focusedId ? getFlatNode(current.tree, focusedId) : undefined;
      if (restored && replaced && restored.text !== replaced.text) {
        view.targetCaretOffset = changeEnd(restored.text, replaced.text);
      }

      publish(tree);
      set(view);
      return true;
    };

    const insertAt = (
      targetId: NodeId,
      position: DropPosition,
      items: FlatNodeInput[],
      view: (createdIds: NodeId[]) => Partial<EditorViewState> = () => ({})
    ): NodeId[] =>
      transact(() => {
        const createdIds = createdIdsOf(
          apply(insertRequests(currentTree(), targetId, position, items))[0]
        );
        if (createdIds.length > 0) apply([], view(createdIds));
        return createdIds;
      });

    /** 대상 바로 뒤에 넣는다. 대상이 없으면 맨 위 단계의 맨 끝에 넣는다. */
    const insertAfterOrAtEnd = (
      targetId: NodeId | null,
      items: FlatNodeInput[],
      view: (createdIds: NodeId[]) => Partial<EditorViewState>
    ): NodeId[] =>
      targetId && nodeOf(targetId)
        ? insertAt(targetId, 'after', items, view)
        : insertAt(ROOT_ID, 'inside', items, view);

    const focusFirst = (createdIds: NodeId[]): Partial<EditorViewState> => ({
      focusedNodeId: createdIds[0],
      targetCaretOffset: 0,
    });

    return {
      ...RESET_EDITOR_VIEW,

      getRoots: () => document.getRoots(),
      getTree: currentTree,
      setDefaultView: (view) => document.setDefaultView(view),
      resetView: () => {
        clearHistory();
        set(RESET_EDITOR_VIEW);
      },

      applyPatch: (requests, view) => apply(requests, view),
      batch: (fn) => transact(() => fn(get())),

      undo: () => restore(past, future),
      redo: () => restore(future, past),
      canUndo: () => {
        sync();
        return past.length > 0;
      },
      canRedo: () => {
        sync();
        return future.length > 0;
      },

      insertAfter: (targetId, text = '') =>
        insertAfterOrAtEnd(targetId, [{ text }], focusFirst)[0] ?? null,

      insertNodes: (targetId, nodes) =>
        insertAfterOrAtEnd(targetId, toNodeInputs(nodes), (createdIds) => ({
          ...focusFirst(createdIds),
          selectedNodeIds: [],
        })),

      replaceNodes: (targetIds, nodes) =>
        transact(() => {
          if (nodes.length === 0) {
            get().deleteNodes(targetIds);
            return [];
          }
          const topmost = getTopmostIds(currentTree(), targetIds);
          if (topmost.length === 0) return get().insertNodes(null, nodes);

          const createdIds = insertAt(topmost[0], 'before', toNodeInputs(nodes), (ids) => ({
            ...focusFirst(ids),
            selectedNodeIds: [],
          }));
          apply(topmost.map((id) => ({ op: 'delete', id, recursively: true })));
          return createdIds;
        }),

      appendChild: (parentId, text = '') =>
        insertAt(nodeOf(parentId) ? parentId : ROOT_ID, 'inside', [{ text }], focusFirst)[0] ?? null,

      splitNode: (targetId, before, after) =>
        transact(() => {
          if (!nodeOf(targetId)) return null;
          apply([{ op: 'replace', id: targetId, text: before }]);
          return insertAt(targetId, 'after', [{ text: after }], focusFirst)[0] ?? null;
        }),

      joinWithPrevious: (targetId, previousId, mergedText, caretOffset) =>
        transact(() => {
          if (!nodeOf(previousId)) return false;
          const [removed] = apply([{ op: 'delete', id: targetId }]);
          if (!removed.ok) return false;
          apply([{ op: 'replace', id: previousId, text: mergedText }], {
            focusedNodeId: previousId,
            targetCaretOffset: caretOffset,
            selectedNodeIds: [],
          });
          return true;
        }),

      indent: (targetId) => {
        const requests = indentRequests(currentTree(), targetId);
        if (requests.length === 0) return false;
        apply(requests, { focusedNodeId: targetId });
        return true;
      },

      indentNodes: (targetIds) =>
        transact(() => {
          let count = 0;
          for (const id of getTopmostIds(currentTree(), targetIds)) {
            const requests = indentRequests(currentTree(), id);
            if (requests.length === 0) continue;
            apply(requests);
            count++;
          }
          return count > 0;
        }),

      outdent: (targetId) => {
        const requests = outdentRequests(currentTree(), targetId);
        if (requests.length === 0) return false;
        apply(requests, { focusedNodeId: targetId });
        return true;
      },

      // 부모 바로 뒤에 원래 순서대로 놓이도록 뒤에서부터 내어 쓴다.
      outdentNodes: (targetIds) =>
        transact(() => {
          let count = 0;
          for (const id of getTopmostIds(currentTree(), targetIds).reverse()) {
            const requests = outdentRequests(currentTree(), id);
            if (requests.length === 0) continue;
            apply(requests);
            count++;
          }
          return count > 0;
        }),

      deleteNode: (targetId) => apply([{ op: 'delete', id: targetId, recursively: true }])[0].ok,

      updateText: (targetId, text) => {
        apply([{ op: 'replace', id: targetId, text }], {}, targetId);
      },

      toggleFold: (targetId) => {
        const node = nodeOf(targetId);
        if (node) apply([{ op: 'set_fold', id: targetId, isFolded: !node.isFolded }]);
      },

      setFoldDeep: (targetId, isFolded) => {
        apply([{ op: 'set_fold', id: targetId, isFolded, deep: true }]);
      },

      // 지금 보고 있는 범위(줌인했으면 그 불릿의 하위, 아니면 맨 위 단계)의 끝에 새 불릿을 만든다.
      addBulletAtEnd: () => get().appendChild(get().activeRootId ?? ROOT_ID, ''),

      // 자기 자신이나 자신의 하위로 옮기려는 시도는 실패로 처리한다.
      moveNodes: (sourceIds, targetId, position) => {
        const tree = currentTree();
        const topmost = getTopmostIds(tree, sourceIds);
        if (topmost.length === 0) return false;
        if (targetId !== null) {
          if (!getFlatNode(tree, targetId)) return false;
          if (topmost.some((id) => isInSubtree(tree, id, targetId))) return false;
        }

        const requests =
          targetId !== null
            ? moveRequests(tree, topmost, targetId, position)
            : moveRequests(tree, topmost, ROOT_ID, position === 'inside-start' ? position : 'inside');
        apply(requests);
        return true;
      },

      // 복제본을 각 원본의 바로 아래에 둔다. (하위 트리 포함, id 는 모두 새로 발급)
      duplicateNodes: (sourceIds) =>
        transact(() => {
          const createdIds: NodeId[] = [];
          for (const id of getTopmostIds(currentTree(), sourceIds)) {
            const copy = subtreeInput(currentTree(), id);
            if (copy) createdIds.push(...insertAt(id, 'after', [copy]));
          }
          if (createdIds.length > 0) apply([], { selectedNodeIds: [] });
          return createdIds;
        }),

      // 복제본을 대상 기준 자리에 둔다. 원본은 그대로 남는다. (Alt+드래그)
      duplicateNodesTo: (sourceIds, targetId, position) => {
        const tree = currentTree();
        const copies = getTopmostIds(tree, sourceIds)
          .map((id) => subtreeInput(tree, id))
          .filter((copy): copy is FlatNodeInput => copy !== null);
        if (copies.length === 0) return false;

        const createdIds =
          targetId !== null
            ? insertAt(targetId, position, copies, () => ({ selectedNodeIds: [] }))
            : insertAt(ROOT_ID, position === 'inside-start' ? position : 'inside', copies, () => ({
                selectedNodeIds: [],
              }));
        return createdIds.length > 0;
      },

      deleteNodes: (targetIds) => {
        const topmost = getTopmostIds(currentTree(), targetIds);
        if (topmost.length === 0) return false;
        apply(
          topmost.map((id) => ({ op: 'delete', id, recursively: true })),
          { selectedNodeIds: [] }
        );
        return true;
      },

      // 종류를 바꾸면 "보드로 보기" 지정은 풀린다. (보드는 종류가 아니라 보기 방식이다)
      setNodesType: (targetIds, nodeType) => {
        apply(
          targetIds.flatMap((id): TreePatchRequest[] => [
            { op: 'set_node_type', id, nodeType },
            { op: 'set_view_mode', id },
          ])
        );
      },

      setNodesViewMode: (targetIds, viewMode) => {
        apply(targetIds.map((id) => ({ op: 'set_view_mode', id, viewMode })));
      },

      // 고른 것 중 하나라도 미완료면 모두 완료로, 모두 완료면 모두 미완료로 바꾼다.
      setNodesCompleted: (targetIds) => {
        const allCompleted = targetIds.every((id) => nodeOf(id)?.isCompleted === true);
        apply(targetIds.map((id) => ({ op: allCompleted ? 'uncomplete' : 'complete', id })));
      },

      selectNodes: (nodeIds) => setView({ selectedNodeIds: nodeIds }),
      clearSelection: () => {
        if (get().selectedNodeIds.length > 0) setView({ selectedNodeIds: [] });
      },

      toggleCompleted: (targetId) => {
        const node = nodeOf(targetId);
        if (node) apply([{ op: node.isCompleted ? 'uncomplete' : 'complete', id: targetId }]);
      },

      setNote: (targetId, note) => {
        apply([{ op: 'set_note', id: targetId, note }]);
      },

      // 파일 하나가 불릿 하나다. (Workflowy 방식)
      // 빈 불릿에 붙이면 그 불릿이 파일 불릿이 되고, 남은 파일은 그 뒤에 줄줄이 놓인다.
      // 글자나 파일이 이미 있는 불릿에 붙이면 모두 그 아래 새 불릿으로 들어간다.
      attachFiles: (targetId, targets) =>
        transact(() => {
          const target = nodeOf(targetId);
          if (!target || targets.length === 0) return [];
          const fileBullet = (fileTarget: string): FlatNodeInput => ({
            text: '',
            file: { target: fileTarget },
          });

          if (target.text === '' && !target.file) {
            apply([{ op: 'set_file', id: targetId, file: { target: targets[0] } }]);
            const attached = [targetId];
            for (const fileTarget of targets.slice(1)) {
              attached.push(...insertAt(attached[attached.length - 1], 'after', [fileBullet(fileTarget)]));
            }
            return attached;
          }
          return insertAt(targetId, 'inside', targets.map(fileBullet));
        }),

      detachFile: (targetId) => {
        apply([{ op: 'set_file', id: targetId }]);
      },

      startNoteEdit: (nodeId) => setView({ noteEditingNodeId: nodeId }),
      endNoteEdit: () => setView({ noteEditingNodeId: null }),

      setZoom: (nodeId) =>
        setView({
          activeRootId: nodeId,
          focusedNodeId: nodeId,
        }),

      // 불릿 글자를 고치기 시작하면 묶음 선택은 푼다. 포커스를 떼는 것(null)만으로는 풀지 않는다.
      // (여러 줄을 끌어 고를 때 입력칸의 포커스가 떨어지는데, 그때 방금 고른 선택이 지워지면 안 된다)
      setFocus: (nodeId, caretOffset) =>
        setView({
          focusedNodeId: nodeId,
          targetCaretOffset: nodeId && caretOffset !== undefined ? caretOffset : null,
          ...(nodeId ? { selectedNodeIds: [] } : {}),
        }),
    };
  });
}
