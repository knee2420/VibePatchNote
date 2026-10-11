/**
 * @file useTreeStore.ts
 * @description 아웃라인 문서 상태의 단일 소유자 (Zustand)
 *
 * "현재 문서"와 "그 문서가 묶인 로컬 파일"은 항상 함께 바뀌어야 한다.
 * 둘을 따로 두면 문서만 바뀌고 핸들이 남아, 자동 저장이 엉뚱한 파일을 덮어쓴다.
 * 그래서 문서를 통째로 바꾸는 길은 `loadDocument` 하나뿐이고, 파일 결합을 반드시 함께 받는다.
 */

import { create } from 'zustand';
import {
  type OutlineDocument,
  type NodeId,
  createSampleDocument,
  insertAfter,
  appendChild,
  indentNode,
  outdentNode,
  deleteNode,
  updateNodeText,
  toggleFold,
} from '@vibe/outliner-core';

interface TreeStoreState {
  document: OutlineDocument;
  fileHandle: FileSystemFileHandle | null; // 현재 문서가 묶인 로컬 파일 (null이면 파일에 묶이지 않은 문서)
  activeRootId: NodeId | null; // 줌인된 루트 노드 ID
  focusedNodeId: NodeId | null; // 현재 포커스 대상 노드 ID
  targetCaretOffset: number | null; // 포커스 복원 시 캐럿 위치
  isDirty: boolean; // 디스크 저장 대기 플래그

  // 상태 변경 액션
  loadDocument: (doc: OutlineDocument, fileHandle: FileSystemFileHandle | null) => void;
  bindFile: (fileHandle: FileSystemFileHandle) => void; // 같은 문서를 새 파일에 묶는다 (다른 이름으로 저장)
  updateTitle: (title: string) => void;
  insertAfter: (targetId: NodeId, text?: string) => NodeId | null;
  appendChild: (parentId: NodeId, text?: string) => NodeId | null;
  indent: (targetId: NodeId) => boolean;
  outdent: (targetId: NodeId) => boolean;
  deleteNode: (targetId: NodeId) => boolean;
  updateText: (targetId: NodeId, text: string) => void;
  toggleFold: (targetId: NodeId) => void;
  setZoom: (nodeId: NodeId | null) => void;
  setFocus: (nodeId: NodeId | null, caretOffset?: number) => void;
  markClean: () => void;
}

export const useTreeStore = create<TreeStoreState>((set, get) => ({
  document: createSampleDocument(),
  fileHandle: null,
  activeRootId: null,
  focusedNodeId: null,
  targetCaretOffset: null,
  isDirty: false,

  loadDocument: (doc, fileHandle) =>
    set({
      document: doc,
      fileHandle,
      activeRootId: null,
      focusedNodeId: null,
      isDirty: false,
    }),

  bindFile: (fileHandle) => set({ fileHandle, isDirty: false }),

  updateTitle: (title) =>
    set((state) => ({
      document: { ...state.document, title, updatedAt: Date.now() },
      isDirty: true,
    })),

  insertAfter: (targetId, text = '') => {
    const { document } = get();
    const { newNodes, createdNode } = insertAfter(document.rootNodes, targetId, text);
    set({
      document: { ...document, rootNodes: newNodes, updatedAt: Date.now() },
      focusedNodeId: createdNode.id,
      targetCaretOffset: 0,
      isDirty: true,
    });
    return createdNode.id;
  },

  appendChild: (parentId, text = '') => {
    const { document } = get();
    const { newNodes, createdNode } = appendChild(document.rootNodes, parentId, text);
    set({
      document: { ...document, rootNodes: newNodes, updatedAt: Date.now() },
      focusedNodeId: createdNode.id,
      targetCaretOffset: 0,
      isDirty: true,
    });
    return createdNode.id;
  },

  indent: (targetId) => {
    const { document } = get();
    const res = indentNode(document.rootNodes, targetId);
    if (!res.success) return false;
    set({
      document: { ...document, rootNodes: res.newNodes, updatedAt: Date.now() },
      focusedNodeId: targetId,
      isDirty: true,
    });
    return true;
  },

  outdent: (targetId) => {
    const { document } = get();
    const res = outdentNode(document.rootNodes, targetId);
    if (!res.success) return false;
    set({
      document: { ...document, rootNodes: res.newNodes, updatedAt: Date.now() },
      focusedNodeId: targetId,
      isDirty: true,
    });
    return true;
  },

  deleteNode: (targetId) => {
    const { document } = get();
    const res = deleteNode(document.rootNodes, targetId);
    if (!res.success) return false;
    set({
      document: { ...document, rootNodes: res.newNodes, updatedAt: Date.now() },
      isDirty: true,
    });
    return true;
  },

  updateText: (targetId, text) => {
    const { document } = get();
    const res = updateNodeText(document.rootNodes, targetId, text);
    if (!res.success) return;
    set({
      document: { ...document, rootNodes: res.newNodes, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  toggleFold: (targetId) => {
    const { document } = get();
    const res = toggleFold(document.rootNodes, targetId);
    if (!res.success) return;
    set({
      document: { ...document, rootNodes: res.newNodes, updatedAt: Date.now() },
      isDirty: true,
    });
  },

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

  markClean: () => set({ isDirty: false }),
}));
