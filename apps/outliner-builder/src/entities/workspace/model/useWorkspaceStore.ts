/**
 * @file useWorkspaceStore.ts
 * @description 워크스페이스 데이터의 단일 창구 (Zustand 엔티티)
 *
 * 메모리와 파일의 유일한 루트는 `workspace` 하나다. 에디터 화면은 독립 문서를 갖지 않고
 * `workspace.projects[workspace.activeProjectId]` 를 들여다보고 고치는 렌즈일 뿐이다.
 *
 * 데이터를 바꾸는 길은 `commit` 하나뿐이다. 모든 변경 액션이 이 관문을 지나며 `isDirty` 를 켠다.
 * 저장 파이프라인은 `workspace`·`vaultHandle`·`isDirty` 만 보므로, 여기에 새 액션을 추가해도
 * 저장 코드는 고칠 필요가 없다.
 *
 * FSD 원칙: entities 계층은 다른 entities 슬라이스를 직접 import하지 않는다.
 */

import { create } from 'zustand';
import {
  type DropPosition,
  type NodeId,
  type OutlineNode,
  type OutlineNodeType,
  type Project,
  type ProjectId,
  type Snapshot,
  type SnapshotId,
  type ViewMode,
  type Workspace,
  type RelationsGraph,
  createEmptyWorkspace,
  createSnapshot,
  restoreSnapshot,
  forkProject,
  extractToProject,
  buildRelationsGraph,
  addChildProjectToWorkspace,
  removeProjectFromWorkspace,
  renameProjectInWorkspace,
  setProjectTitleInWorkspace,
  syncProjectRootsInWorkspace,
  importProjectsIntoWorkspace,
  linkChildProjectInParent,
  findChildProjectsLosingRef,
  commitProjectRefText,
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
  getTopmostNodeIds,
  getPath,
  findNode,
  generateNodeId,
} from '@vibe/outliner-core';

export type WorkspaceViewMode = 'focus' | 'overview';

/** 파일에 저장되지 않는 에디터 화면 상태 (줌·포커스·캐럿) */
interface EditorViewState {
  activeRootId: NodeId | null; // 줌인된 루트 노드 ID
  focusedNodeId: NodeId | null; // 현재 포커스 대상 노드 ID
  targetCaretOffset: number | null; // 포커스 복원 시 캐럿 위치
  noteEditingNodeId: NodeId | null; // 노트 입력 칸을 열어 포커스할 노드 ID
  selectedNodeIds: NodeId[]; // 마우스로 여러 개 고른 불릿 (묶음 조작 대상)
}

interface WorkspaceStoreState extends EditorViewState {
  // ── 데이터 (단일 진실 원천) ──
  workspace: Workspace;
  vaultHandle: FileSystemDirectoryHandle | null; // 워크스페이스가 묶인 보관함 폴더 (null이면 묶이지 않음)
  isDirty: boolean; // 디스크 저장 대기 플래그

  // ── 화면 상태 ──
  viewMode: WorkspaceViewMode;
  isHistoryDrawerOpen: boolean;
  selectedSnapshotId: SnapshotId | null;

  // 보관함 결합
  loadWorkspace: (
    workspace: Workspace,
    vaultHandle: FileSystemDirectoryHandle | null,
    options?: { dirty?: boolean }
  ) => void;
  bindVault: (vaultHandle: FileSystemDirectoryHandle) => void;
  importWorkspace: (source: Workspace) => number;
  markClean: (savedWorkspace?: Workspace) => void;
  setDirty: () => void;

  // 뷰포트 전환
  setViewMode: (mode: WorkspaceViewMode) => void;
  focusProject: (projectId: ProjectId) => void;
  returnToOverview: () => void;

  // 활성 프로젝트 불릿 편집
  updateActiveProjectNodes: (roots: OutlineNode[]) => void;
  updateActiveProjectTitle: (title: string) => void;
  setActiveProjectView: (view: ViewMode) => void;
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
  finishRefEdit: (targetId: NodeId) => void;
  toggleCompleted: (targetId: NodeId) => void;
  setNote: (targetId: NodeId, note: string) => void;
  startNoteEdit: (nodeId: NodeId) => void;
  endNoteEdit: () => void;
  setZoom: (nodeId: NodeId | null) => void;
  setFocus: (nodeId: NodeId | null, caretOffset?: number) => void;

  // 프로젝트 수명주기
  createProject: (title?: string, parentProjectId?: ProjectId | null) => ProjectId;
  deleteProject: (projectId: ProjectId) => boolean;
  forkCurrentProject: (projectId: ProjectId, title?: string, parentProjectId?: ProjectId | null) => ProjectId;
  extractSubtreeToNewProject: (
    sourceProjectId: ProjectId,
    targetNodeId: string,
    newProjectTitle?: string,
    mode?: 'child' | 'standalone',
    parentProjectId?: ProjectId | null
  ) => ProjectId | null;
  updateProjectTitle: (projectId: ProjectId, title: string) => void;

  // 버전 히스토리 & 스냅샷
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  selectSnapshot: (snapshotId: SnapshotId | null) => void;
  takeSnapshot: (projectId: ProjectId, milestoneName?: string, summary?: string) => Snapshot | null;
  rollbackToSnapshot: (projectId: ProjectId, snapshotId: SnapshotId) => boolean;

  // 관계망 그래프 셀렉터
  getRelationsGraph: () => RelationsGraph;
}

const RESET_EDITOR_VIEW: EditorViewState = {
  activeRootId: null,
  focusedNodeId: null,
  targetCaretOffset: null,
  noteEditingNodeId: null,
  selectedNodeIds: [],
};

/**
 * 연결 불릿이 사라져 하위 프로젝트까지 지워지게 될 때 사용자에게 확인을 받는다.
 * 되돌리기가 없으므로, 어느 경로로 지워지든 반드시 이 확인을 거친다.
 */
function confirmCascadeDelete(workspace: Workspace, lostProjectIds: ProjectId[]): boolean {
  const titles = lostProjectIds.map((id) => `'${workspace.projects[id].title}'`).join(', ');
  const hasDescendants = Object.values(workspace.projects).some(
    (p) => p.parentProjectId && lostProjectIds.includes(p.parentProjectId)
  );
  return window.confirm(
    `연결 불릿이 사라지면 하위 프로젝트 ${titles}도 함께 삭제됩니다.\n` +
      (hasDescendants ? '그 아래에 있던 프로젝트는 한 단계 위로 올라갑니다.\n' : '') +
      '되돌릴 수 없습니다. 계속하시겠습니까?'
  );
}

/** 현재 에디터가 들여다보는 프로젝트 */
export const selectActiveProject = (s: WorkspaceStoreState): Project =>
  s.workspace.projects[s.workspace.activeProjectId];

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => {
  /** 데이터 변경의 유일한 관문. 워크스페이스를 교체하고 저장 대기를 켠다. */
  const commit = (workspace: Workspace, view: Partial<WorkspaceStoreState> = {}) =>
    set({ ...view, workspace, isDirty: true });

  /**
   * 한 프로젝트의 불릿 트리를 바꾸는 유일한 길.
   * 바뀐 트리에서 하위 프로젝트의 연결 불릿이 사라지면, 확인을 받은 뒤 그 하위 프로젝트도 함께 지운다.
   * 백스페이스·메뉴 삭제·상위 불릿 삭제·스냅샷 복원 어느 경로든 여기서 똑같이 처리된다.
   * 사용자가 취소하면 아무것도 바꾸지 않고 false 를 돌려준다.
   */
  const replaceProjectRoots = (
    projectId: ProjectId,
    roots: OutlineNode[],
    view: Partial<EditorViewState> = {}
  ): boolean => {
    const { workspace } = get();
    const lostProjectIds = findChildProjectsLosingRef(workspace, projectId, roots);
    if (lostProjectIds.length > 0 && !confirmCascadeDelete(workspace, lostProjectIds)) {
      return false;
    }

    let next = syncProjectRootsInWorkspace(workspace, projectId, roots);
    for (const lostId of lostProjectIds) {
      next = removeProjectFromWorkspace(next, lostId).updatedWorkspace;
    }

    const switchedProject = next.activeProjectId !== workspace.activeProjectId;
    commit(next, switchedProject ? { ...RESET_EDITOR_VIEW, ...view } : view);
    return true;
  };

  /** 활성 프로젝트의 불릿 트리를 교체한다. */
  const commitActiveRoots = (roots: OutlineNode[], view: Partial<EditorViewState> = {}) =>
    replaceProjectRoots(get().workspace.activeProjectId, roots, view);

  const activeRoots = () => selectActiveProject(get()).rootNodes;

  return {
    workspace: createEmptyWorkspace('내 생각 워크스페이스'),
    vaultHandle: null,
    isDirty: false,
    viewMode: 'focus',
    isHistoryDrawerOpen: false,
    selectedSnapshotId: null,
    ...RESET_EDITOR_VIEW,

    // "현재 워크스페이스"와 "그것이 묶인 보관함"은 항상 함께 바뀐다.
    // 따로 두면 워크스페이스만 바뀌고 핸들이 남아, 자동 저장이 엉뚱한 폴더를 덮어쓴다.
    // 읽으면서 바로잡은 내용이 있으면 `dirty` 로 알려, 곧바로 폴더에도 반영되게 한다.
    loadWorkspace: (workspace, vaultHandle, options) => {
      const activeProjectId = workspace.projects[workspace.activeProjectId]
        ? workspace.activeProjectId
        : Object.keys(workspace.projects)[0];
      set({
        ...RESET_EDITOR_VIEW,
        workspace: workspace.activeProjectId === activeProjectId
          ? workspace
          : { ...workspace, activeProjectId },
        vaultHandle,
        isDirty: options?.dirty ?? false,
        viewMode: 'focus',
        isHistoryDrawerOpen: false,
        selectedSnapshotId: null,
      });
    },

    // 지금 메모리에 있는 워크스페이스를 그대로 둔 채 보관함에 묶는다. (전체가 저장 대기가 된다)
    bindVault: (vaultHandle) => set({ vaultHandle, isDirty: true }),

    importWorkspace: (source) => {
      const { updatedWorkspace, importedProjectIds } = importProjectsIntoWorkspace(
        get().workspace,
        source
      );
      if (importedProjectIds.length === 0) return 0;

      commit(
        { ...updatedWorkspace, activeProjectId: importedProjectIds[0] },
        { ...RESET_EDITOR_VIEW, viewMode: 'focus', selectedSnapshotId: null }
      );
      return importedProjectIds.length;
    },

    // 방금 디스크에 쓴 워크스페이스를 넘기면, 쓰는 동안 들어온 편집은 저장 대기로 남는다.
    markClean: (savedWorkspace) =>
      set((state) => ({
        isDirty: savedWorkspace !== undefined && state.workspace !== savedWorkspace,
      })),

    setDirty: () => set({ isDirty: true }),

    setViewMode: (mode) => set({ viewMode: mode }),

    focusProject: (projectId) => {
      const { workspace } = get();
      if (!workspace.projects[projectId]) return;

      const view = { ...RESET_EDITOR_VIEW, viewMode: 'focus' as const, selectedSnapshotId: null };
      if (workspace.activeProjectId === projectId) {
        set(view);
        return;
      }
      commit({ ...workspace, activeProjectId: projectId }, view);
    },

    returnToOverview: () => {
      set({ viewMode: 'overview', isHistoryDrawerOpen: false });
    },

    updateActiveProjectNodes: (roots) => commitActiveRoots(roots),

    // 제목을 바꾸면 다른 프로젝트 안의 연결 불릿 글자도 곧바로 따라온다.
    updateActiveProjectTitle: (title) => {
      const { workspace } = get();
      commit(setProjectTitleInWorkspace(workspace, workspace.activeProjectId, title));
    },

    setActiveProjectView: (view) => {
      const { workspace } = get();
      const project = selectActiveProject(get());
      commit({
        ...workspace,
        projects: {
          ...workspace.projects,
          [project.id]: { ...project, defaultView: view, updatedAt: Date.now() },
        },
        updatedAt: Date.now(),
      });
    },

    insertAfter: (targetId, text = '') => {
      const { newNodes, createdNode } = insertAfter(activeRoots(), targetId, text);
      commitActiveRoots(newNodes, { focusedNodeId: createdNode.id, targetCaretOffset: 0 });
      return createdNode.id;
    },

    appendChild: (parentId, text = '') => {
      const { newNodes, createdNode } = appendChild(activeRoots(), parentId, text);
      commitActiveRoots(newNodes, { focusedNodeId: createdNode.id, targetCaretOffset: 0 });
      return createdNode.id;
    },

    indent: (targetId) => {
      const res = indentNode(activeRoots(), targetId);
      if (!res.success) return false;
      commitActiveRoots(res.newNodes, { focusedNodeId: targetId });
      return true;
    },

    outdent: (targetId) => {
      const res = outdentNode(activeRoots(), targetId);
      if (!res.success) return false;
      commitActiveRoots(res.newNodes, { focusedNodeId: targetId });
      return true;
    },

    deleteNode: (targetId) => {
      const res = deleteNode(activeRoots(), targetId);
      if (!res.success) return false;
      return commitActiveRoots(res.newNodes);
    },

    updateText: (targetId, text) => {
      const res = updateNodeText(activeRoots(), targetId, text);
      if (!res.success) return;
      commitActiveRoots(res.newNodes);
    },

    toggleFold: (targetId) => {
      const res = toggleFold(activeRoots(), targetId);
      if (!res.success) return;
      commitActiveRoots(res.newNodes);
    },

    setFoldDeep: (targetId, isFolded) => {
      const res = setFoldDeep(activeRoots(), targetId, isFolded);
      if (!res.success) return;
      commitActiveRoots(res.newNodes);
    },

    // 지금 보고 있는 범위(줌인했으면 그 불릿의 하위, 아니면 맨 위 단계)의 끝에 새 불릿을 만든다.
    addBulletAtEnd: () => {
      const { activeRootId } = get();
      const roots = activeRoots();
      if (activeRootId && findNode(roots, activeRootId)) {
        return get().appendChild(activeRootId, '');
      }
      if (roots.length > 0) {
        return get().insertAfter(roots[roots.length - 1].id, '');
      }
      const now = Date.now();
      const node: OutlineNode = {
        id: generateNodeId(),
        text: '',
        children: [],
        createdAt: now,
        updatedAt: now,
      };
      commitActiveRoots([node], { focusedNodeId: node.id, targetCaretOffset: 0 });
      return node.id;
    },

    moveNodes: (sourceIds, targetId, position) => {
      const { workspace } = get();
      const roots = activeRoots();

      // 하위 프로젝트의 연결 불릿은 맨 위 단계에만 둔다. (프로젝트 탐색기의 단계와 맞추기 위해)
      const landsAtTopLevel =
        targetId === null ||
        ((position === 'before' || position === 'after') &&
          getPath(roots, targetId).length === 1);
      if (!landsAtTopLevel) {
        const carriesChildLink = getTopmostNodeIds(roots, sourceIds).some((id) => {
          const ref = findNode(roots, id)?.ref;
          return (
            ref?.type === 'project' &&
            workspace.projects[ref.targetProjectId]?.parentProjectId ===
              workspace.activeProjectId
          );
        });
        if (carriesChildLink) return false;
      }

      const res = moveNodes(roots, sourceIds, targetId, position);
      if (!res.success) return false;
      return commitActiveRoots(res.newNodes);
    },

    duplicateNodes: (sourceIds) => {
      const res = duplicateNodes(activeRoots(), sourceIds);
      if (res.createdIds.length === 0) return [];
      commitActiveRoots(res.newNodes, { selectedNodeIds: [] });
      return res.createdIds;
    },

    duplicateNodesTo: (sourceIds, targetId, position) => {
      const res = duplicateNodesTo(activeRoots(), sourceIds, targetId, position);
      if (!res.success) return false;
      return commitActiveRoots(res.newNodes, { selectedNodeIds: [] });
    },

    deleteNodes: (targetIds) => {
      const res = deleteNodes(activeRoots(), targetIds);
      if (res.count === 0) return false;
      return commitActiveRoots(res.newNodes, { selectedNodeIds: [] });
    },

    // 종류를 바꾸면 "보드로 보기" 지정은 풀린다. (보드는 종류가 아니라 보기 방식이다)
    setNodesType: (targetIds, nodeType) => {
      const typed = setNodesType(activeRoots(), targetIds, nodeType);
      const res = setNodesViewMode(typed.newNodes, targetIds, undefined);
      if (typed.count === 0 && res.count === 0) return;
      commitActiveRoots(res.newNodes);
    },

    setNodesViewMode: (targetIds, viewMode) => {
      const res = setNodesViewMode(activeRoots(), targetIds, viewMode);
      if (res.count === 0) return;
      commitActiveRoots(res.newNodes);
    },

    // 고른 것 중 하나라도 미완료면 모두 완료로, 모두 완료면 모두 미완료로 바꾼다.
    setNodesCompleted: (targetIds) => {
      const roots = activeRoots();
      const allCompleted = targetIds.every((id) => findNode(roots, id)?.isCompleted === true);
      const res = toggleNodesCompleted(roots, targetIds, !allCompleted);
      if (res.count === 0) return;
      commitActiveRoots(res.newNodes);
    },

    selectNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),
    clearSelection: () => {
      if (get().selectedNodeIds.length > 0) set({ selectedNodeIds: [] });
    },

    // 연결 불릿의 글자 편집을 마쳤을 때에만, 그 글자를 하위 프로젝트 제목으로 확정한다.
    finishRefEdit: (targetId) => {
      const { workspace } = get();
      const next = commitProjectRefText(workspace, workspace.activeProjectId, targetId);
      if (next !== workspace) commit(next);
    },

    toggleCompleted: (targetId) => {
      const res = toggleNodesCompleted(activeRoots(), [targetId]);
      if (res.count === 0) return;
      commitActiveRoots(res.newNodes);
    },

    setNote: (targetId, note) => {
      const res = setNodeNote(activeRoots(), targetId, note);
      if (!res.success) return;
      commitActiveRoots(res.newNodes);
    },

    startNoteEdit: (nodeId) => set({ noteEditingNodeId: nodeId }),
    endNoteEdit: () => set({ noteEditingNodeId: null }),

    setZoom: (nodeId) =>
      set({
        activeRootId: nodeId,
        focusedNodeId: nodeId,
      }),

    setFocus: (nodeId, caretOffset = 0) =>
      set({
        focusedNodeId: nodeId,
        targetCaretOffset: caretOffset,
      }),

    createProject: (title = '새 프로젝트', parentProjectId?: ProjectId | null) => {
      const { updatedWorkspace, newProject } = addChildProjectToWorkspace(get().workspace, {
        title,
        parentProjectId,
      });

      // 최상위 프로젝트는 만들자마자 그 프로젝트로 전환한다.
      if (parentProjectId) {
        commit(updatedWorkspace);
      } else {
        commit(
          { ...updatedWorkspace, activeProjectId: newProject.id },
          { ...RESET_EDITOR_VIEW, viewMode: 'focus', selectedSnapshotId: null }
        );
      }

      return newProject.id;
    },

    deleteProject: (projectId) => {
      const { workspace } = get();
      const res = removeProjectFromWorkspace(workspace, projectId);
      if (!res.success) return false;

      const switched = res.updatedWorkspace.activeProjectId !== workspace.activeProjectId;
      commit(res.updatedWorkspace, switched ? RESET_EDITOR_VIEW : {});
      return true;
    },

    forkCurrentProject: (projectId, title, parentProjectId) => {
      const { workspace } = get();
      const source = workspace.projects[projectId];
      if (!source) return projectId;

      const forked = forkProject(source, title, parentProjectId);
      const withFork: Workspace = {
        ...workspace,
        projects: { ...workspace.projects, [forked.id]: forked },
        activeProjectId: forked.id,
        updatedAt: Date.now(),
      };
      // 분기도 하위 프로젝트이므로, 부모의 아웃라인 맨 위 단계에 연결 불릿을 둔다.
      commit(linkChildProjectInParent(withFork, forked.id), {
        ...RESET_EDITOR_VIEW,
        viewMode: 'focus',
        selectedSnapshotId: null,
      });
      return forked.id;
    },

    extractSubtreeToNewProject: (
      sourceProjectId,
      targetNodeId,
      newProjectTitle,
      mode = 'child',
      parentProjectId?: ProjectId | null
    ) => {
      const { workspace } = get();
      const source = workspace.projects[sourceProjectId];
      if (!source) return null;

      const result = extractToProject(source, targetNodeId, {
        title: newProjectTitle,
        mode,
        parentProjectId,
      });
      if (!result) return null;

      const { updatedSourceProject, newProject } = result;
      commit(
        {
          ...workspace,
          projects: {
            ...workspace.projects,
            [sourceProjectId]: updatedSourceProject,
            [newProject.id]: newProject,
          },
          updatedAt: Date.now(),
        },
        // 추출로 사라진 노드를 줌·포커스가 가리키지 않도록 초기화
        sourceProjectId === workspace.activeProjectId ? RESET_EDITOR_VIEW : {}
      );

      return newProject.id;
    },

    updateProjectTitle: (projectId, title) => {
      commit(renameProjectInWorkspace(get().workspace, projectId, title));
    },

    openHistoryDrawer: () => set({ isHistoryDrawerOpen: true }),
    closeHistoryDrawer: () => set({ isHistoryDrawerOpen: false, selectedSnapshotId: null }),

    selectSnapshot: (snapshotId) => set({ selectedSnapshotId: snapshotId }),

    takeSnapshot: (projectId, milestoneName, summary) => {
      const { workspace } = get();
      const project = workspace.projects[projectId];
      if (!project) return null;

      const snap = createSnapshot(project, { milestoneName, summary });
      commit({
        ...workspace,
        snapshots: {
          ...workspace.snapshots,
          [projectId]: [snap, ...(workspace.snapshots[projectId] ?? [])],
        },
        updatedAt: Date.now(),
      });

      return snap;
    },

    rollbackToSnapshot: (projectId, snapshotId) => {
      const { workspace } = get();
      const project = workspace.projects[projectId];
      const targetSnap = (workspace.snapshots[projectId] ?? []).find((s) => s.id === snapshotId);
      if (!project || !targetSnap) return false;

      return replaceProjectRoots(
        projectId,
        restoreSnapshot(project, targetSnap).rootNodes,
        projectId === workspace.activeProjectId ? RESET_EDITOR_VIEW : {}
      );
    },

    getRelationsGraph: () => {
      return buildRelationsGraph(get().workspace.projects);
    },
  };
});

/** 현재 에디터가 들여다보는 프로젝트를 구독한다. */
export const useActiveProject = (): Project => useWorkspaceStore(selectActiveProject);
