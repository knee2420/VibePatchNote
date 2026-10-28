/**
 * @file outlineSession.ts
 * @description 독립 앱의 편집 화면 하나 — 편집 상태와 호스트 창구를 워크스페이스 창구에 잇는다.
 *
 * 편집 화면(`@vibe/outliner/editor`)은 스캐폴드 하나만 안다. 여기서 "지금 보는 스캐폴드"를 그 하나로 넘겨주고,
 * 편집 화면이 바꾼 불릿 트리는 워크스페이스 창구(`useWorkspaceStore`)로 돌려보낸다.
 * 독립 앱은 한 번에 스캐폴드 하나만 보므로 편집 상태도 앱 전체에 하나다.
 */

import { useStore } from 'zustand';
import {
  type OutlineEditorState,
  type OutlineHost,
  createOutlineEditorStore,
} from '@vibe/outliner/editor';
import { buildNodeLink } from './nodeLink';
import { selectActiveProject, useWorkspaceStore } from './useWorkspaceStore';

export const outlineEditorStore = createOutlineEditorStore({
  getRoots: () => selectActiveProject(useWorkspaceStore.getState()).rootNodes,
  commitRoots: (roots) => useWorkspaceStore.getState().updateActiveProjectNodes(roots),
  setDefaultView: (view) => useWorkspaceStore.getState().setActiveProjectView(view),
});

// 다른 스캐폴드나 다른 워크스페이스를 보게 되면 줌·포커스·선택을 처음으로 되돌린다.
useWorkspaceStore.subscribe((state, previous) => {
  if (state.editorResetKey !== previous.editorResetKey) {
    outlineEditorStore.getState().resetView();
  }
});

/** 편집 화면 밖(내보내기 창 등)에서 편집 상태의 일부를 구독한다. */
export function useOutlineEditorState<T>(selector: (state: OutlineEditorState) => T): T {
  return useStore(outlineEditorStore, selector);
}

function downloadTextFile(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** 브라우저에서의 호스트 창구 */
export const outlineHost: OutlineHost = {
  confirm: async (message) => window.confirm(message),
  copyNodeLink: async (nodeId) => {
    const { activeProjectId } = useWorkspaceStore.getState().workspace;
    await navigator.clipboard.writeText(buildNodeLink(activeProjectId, nodeId));
  },
  exportText: downloadTextFile,
  getPortalRoot: () => window.document.body,
};
