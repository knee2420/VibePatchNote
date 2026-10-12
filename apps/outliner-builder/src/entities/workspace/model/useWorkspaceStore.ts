/**
 * @file useWorkspaceStore.ts
 * @description 워크스페이스 데이터의 단일 창구 (Zustand 엔티티)
 *
 * 메모리와 파일의 유일한 루트는 `workspace` 하나다. 편집 화면은 독립 문서를 갖지 않고
 * `workspace.projects[workspace.activeProjectId]` 를 들여다보고 고치는 렌즈일 뿐이다.
 *
 * 데이터를 바꾸는 길은 `commit` 하나뿐이다. 모든 변경 액션이 이 관문을 지나며 `isDirty` 를 켠다.
 * 저장 파이프라인은 `workspace`·`vaultHandle`·`isDirty` 만 보므로, 여기에 새 액션을 추가해도
 * 저장 코드는 고칠 필요가 없다.
 *
 * 불릿 편집 액션과 화면 상태(줌·포커스·선택)는 `@vibe/outliner-editor` 의 편집 상태가 갖는다.
 * 편집 화면이 바꾼 불릿 트리는 `updateActiveProjectNodes` 로 이 창구에 돌아온다. (`outlineSession.ts`)
 *
 * FSD 원칙: entities 계층은 다른 entities 슬라이스를 직접 import하지 않는다.
 */

import { create } from 'zustand';
import {
  type OutlineNode,
  type Project,
  type ProjectId,
  type ViewMode,
  type Workspace,
  createEmptyWorkspace,
  addProjectToWorkspace,
  removeProjectFromWorkspace,
  renameProjectInWorkspace,
  setProjectTitleInWorkspace,
  syncProjectRootsInWorkspace,
} from '@vibe/outliner-core';

export type WorkspaceViewMode = 'focus' | 'overview';

interface WorkspaceStoreState {
  // ── 데이터 (단일 진실 원천) ──
  workspace: Workspace;
  vaultHandle: FileSystemDirectoryHandle | null; // 워크스페이스가 묶인 보관함 폴더 (null이면 묶이지 않음)
  isDirty: boolean; // 디스크 저장 대기 플래그

  // ── 화면 상태 ──
  viewMode: WorkspaceViewMode;
  /** 편집 화면의 줌·포커스·선택을 처음으로 되돌려야 할 때마다 올라가는 번호 */
  editorResetKey: number;

  // 보관함 결합
  loadWorkspace: (
    workspace: Workspace,
    vaultHandle: FileSystemDirectoryHandle | null,
    options?: { dirty?: boolean }
  ) => void;
  bindVault: (vaultHandle: FileSystemDirectoryHandle) => void;
  markClean: (savedWorkspace?: Workspace) => void;
  setDirty: () => void;

  // 뷰포트 전환
  setViewMode: (mode: WorkspaceViewMode) => void;
  focusProject: (projectId: ProjectId) => void;
  returnToOverview: () => void;

  // 지금 보는 스캐폴드
  updateActiveProjectNodes: (roots: OutlineNode[]) => void;
  updateActiveProjectTitle: (title: string) => void;
  setActiveProjectView: (view: ViewMode) => void;

  // 스캐폴드 수명주기
  createProject: (title?: string) => ProjectId;
  deleteProject: (projectId: ProjectId) => boolean;
  updateProjectTitle: (projectId: ProjectId, title: string) => void;
}

/** 현재 에디터가 들여다보는 프로젝트 */
export const selectActiveProject = (s: WorkspaceStoreState): Project =>
  s.workspace.projects[s.workspace.activeProjectId];

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => {
  /** 데이터 변경의 유일한 관문. 워크스페이스를 교체하고 저장 대기를 켠다. */
  const commit = (workspace: Workspace, view: Partial<WorkspaceStoreState> = {}) =>
    set({ ...view, workspace, isDirty: true });

  /** 다른 스캐폴드를 보게 되었을 때 함께 넘기는 화면 초기화 */
  const resetEditorView = (): Partial<WorkspaceStoreState> => ({
    editorResetKey: get().editorResetKey + 1,
  });

  return {
    workspace: createEmptyWorkspace('내 생각 워크스페이스'),
    vaultHandle: null,
    isDirty: false,
    viewMode: 'focus',
    editorResetKey: 0,

    // "현재 워크스페이스"와 "그것이 묶인 보관함"은 항상 함께 바뀐다.
    // 따로 두면 워크스페이스만 바뀌고 핸들이 남아, 자동 저장이 엉뚱한 폴더를 덮어쓴다.
    // 읽으면서 바로잡은 내용이 있으면 `dirty` 로 알려, 곧바로 폴더에도 반영되게 한다.
    loadWorkspace: (workspace, vaultHandle, options) => {
      const activeProjectId = workspace.projects[workspace.activeProjectId]
        ? workspace.activeProjectId
        : Object.keys(workspace.projects)[0];
      set({
        ...resetEditorView(),
        workspace: workspace.activeProjectId === activeProjectId
          ? workspace
          : { ...workspace, activeProjectId },
        vaultHandle,
        isDirty: options?.dirty ?? false,
        viewMode: 'focus',
      });
    },

    // 지금 메모리에 있는 워크스페이스를 그대로 둔 채 보관함에 묶는다. (전체가 저장 대기가 된다)
    bindVault: (vaultHandle) => set({ vaultHandle, isDirty: true }),

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

      const view = { ...resetEditorView(), viewMode: 'focus' as const };
      if (workspace.activeProjectId === projectId) {
        set(view);
        return;
      }
      commit({ ...workspace, activeProjectId: projectId }, view);
    },

    returnToOverview: () => {
      set({ viewMode: 'overview' });
    },

    // 편집 화면이 바꾼 불릿 트리가 돌아오는 유일한 길
    updateActiveProjectNodes: (roots) => {
      const { workspace } = get();
      commit(syncProjectRootsInWorkspace(workspace, workspace.activeProjectId, roots));
    },

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

    // 새 스캐폴드는 만들자마자 그 스캐폴드로 전환한다.
    createProject: (title = '새 스캐폴드') => {
      const { updatedWorkspace, newProject } = addProjectToWorkspace(get().workspace, title);
      commit(
        { ...updatedWorkspace, activeProjectId: newProject.id },
        { ...resetEditorView(), viewMode: 'focus' }
      );
      return newProject.id;
    },

    deleteProject: (projectId) => {
      const { workspace } = get();
      const res = removeProjectFromWorkspace(workspace, projectId);
      if (!res.success) return false;

      const switched = res.updatedWorkspace.activeProjectId !== workspace.activeProjectId;
      commit(res.updatedWorkspace, switched ? resetEditorView() : {});
      return true;
    },

    updateProjectTitle: (projectId, title) => {
      commit(renameProjectInWorkspace(get().workspace, projectId, title));
    },
  };
});

/** 현재 에디터가 들여다보는 프로젝트를 구독한다. */
export const useActiveProject = (): Project => useWorkspaceStore(selectActiveProject);
