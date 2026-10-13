/**
 * @file useOutlineClipboard.ts
 * @description Electron/옵시디언 및 브라우저 호환 고신뢰도 아웃라인 클립보드(복사·잘라내기·붙여넣기) 훅
 */

import { useCallback } from 'react';
import {
  type NodeId,
  type OutlineNode,
  findNode,
  getTopmostNodeIds,
  parseOutlineToNodes,
  toOutlineText,
} from '@vibe/outliner-core';
import { useEditorApi, useEditorStore, useEditorWindow } from '../session/context';
import { extractFilesFromClipboard, useFileAttach } from '../attachments/useFileAttach';

export const OUTLINE_CLIPBOARD_MIME = 'application/x-vibe-outline+json';

/** Electron 및 브라우저 환경에서 제스처 만료 없이 100% 텍스트를 클립보드에 쓰는 헬퍼 */
async function writeTextReliably(win: Window, text: string): Promise<boolean> {
  // 1. 최신 Clipboard API 시도 (Electron 및 보안 컨텍스트에서 최우선)
  if (win.navigator.clipboard?.writeText) {
    try {
      await win.navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 권한 또는 포커스 예외 발생 시 하위 fallback 실행
    }
  }

  // 2. execCommand('copy') 동기 복사 fallback
  try {
    const doc = win.document;
    const textArea = doc.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    doc.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = doc.execCommand('copy');
    doc.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

export function useOutlineClipboard() {
  const store = useEditorStore((s) => s);
  const api = useEditorApi();
  const win = useEditorWindow();
  const { pasteClipboardFiles } = useFileAttach();

  /** 대상 노드들을 클립보드에 복사 */
  const copyNodes = useCallback(
    async (nodeIds: NodeId[]): Promise<boolean> => {
      if (nodeIds.length === 0) return false;
      const roots = api.getState().getRoots();
      const topmost = getTopmostNodeIds(roots, nodeIds);
      const nodes = topmost
        .map((id) => findNode(roots, id))
        .filter((n): n is OutlineNode => n !== null);

      if (nodes.length === 0) return false;

      const plainText = toOutlineText(nodes);
      return writeTextReliably(win, plainText);
    },
    [api, win]
  );

  /** 대상 노드들을 클립보드에 복사 후 확인창 없이 즉시 삭제 (잘라내기) - Undo 지원 */
  const cutNodes = useCallback(
    async (nodeIds: NodeId[]): Promise<boolean> => {
      if (nodeIds.length === 0) return false;
      const roots = api.getState().getRoots();
      const topmost = getTopmostNodeIds(roots, nodeIds);
      if (topmost.length === 0) return false;

      // 1. 먼저 클립보드에 복사
      await copyNodes(nodeIds);

      // 2. 확인창 없이 즉시 원자적 삭제 (Undo 스택에 자동 기록됨)
      store.deleteNodes(topmost);
      store.clearSelection();
      return true;
    },
    [api, copyNodes, store]
  );

  /** DataTransfer 이벤트 객체로부터 붙여넣기 (paste 이벤트 대응) */
  const pasteFromDataTransfer = useCallback(
    async (
      targetId: NodeId | null,
      clipboardData: DataTransfer,
      replaceIds?: NodeId[]
    ): Promise<boolean> => {
      // 1. 파일 첨부 우선 검사
      const files = extractFilesFromClipboard(clipboardData);
      if (files.length > 0 && targetId) {
        await pasteClipboardFiles(targetId, clipboardData);
        return true;
      }

      // 2. 텍스트 추출
      const text = clipboardData.getData('text/plain');
      if (!text || text.trim().length === 0) return false;

      // 3. 계층적 OutlineNode 트리로 파싱
      const incomingNodes = parseOutlineToNodes(text);
      if (incomingNodes.length === 0) return false;

      // 4. 다중 선택 상태면 선택 노드들을 대체, 아니면 targetId 뒤에 삽입
      if (replaceIds && replaceIds.length > 0) {
        store.replaceNodes(replaceIds, incomingNodes);
      } else {
        store.insertNodes(targetId, incomingNodes);
      }

      return true;
    },
    [pasteClipboardFiles, store]
  );

  /** Clipboard API 로부터 직접 텍스트를 읽어 붙여넣기 (Ctrl+V 키보드 단축키 대응) */
  const pasteFromClipboard = useCallback(
    async (targetId: NodeId | null, replaceIds?: NodeId[]): Promise<boolean> => {
      try {
        if (!win.navigator.clipboard?.readText) return false;
        const text = await win.navigator.clipboard.readText();
        if (!text || text.trim().length === 0) return false;

        const incomingNodes = parseOutlineToNodes(text);
        if (incomingNodes.length === 0) return false;

        if (replaceIds && replaceIds.length > 0) {
          store.replaceNodes(replaceIds, incomingNodes);
        } else {
          store.insertNodes(targetId, incomingNodes);
        }
        return true;
      } catch (err) {
        console.error('클립보드 읽기 실패:', err);
        return false;
      }
    },
    [store, win]
  );

  return {
    copyNodes,
    cutNodes,
    pasteFromDataTransfer,
    pasteFromClipboard,
  };
}
