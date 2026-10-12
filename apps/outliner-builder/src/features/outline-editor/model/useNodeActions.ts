/**
 * @file useNodeActions.ts
 * @description 불릿(한 개 또는 여러 개)에 대한 빠른 조작 훅
 *
 * 노드 메뉴, 여러 불릿 선택 막대, 키보드 단축키가 같은 조작을 하므로,
 * 조작의 정의는 여기 한 곳에만 둔다.
 */

import { useCallback } from 'react';
import {
  type FlattenedNode,
  type NodeId,
  type OutlineNode,
  type OutlineNodeType,
  findNode,
  getTopmostNodeIds,
  toOutlineText,
} from '@vibe/outliner-core';
import { selectActiveProject, useWorkspaceStore } from '@/entities/workspace';
import { buildNodeLink } from './useNodeLink';

/** "종류 바꾸기"에서 고를 수 있는 것. 보드는 종류가 아니라 보기 방식이지만 같은 자리에서 고른다. */
export type TurnIntoOption = OutlineNodeType | 'board';

export const TURN_INTO_OPTIONS: Array<{ value: TurnIntoOption; label: string }> = [
  { value: 'bullet', label: '불릿' },
  { value: 'h1', label: '제목 1' },
  { value: 'h2', label: '제목 2' },
  { value: 'h3', label: '제목 3' },
  { value: 'paragraph', label: '문단' },
  { value: 'todo', label: '할 일' },
  { value: 'quote', label: '인용' },
  { value: 'code', label: '코드' },
  { value: 'divider', label: '구분선' },
  { value: 'board', label: '보드' },
];

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

export function useNodeActions() {
  const toggleCompleted = useWorkspaceStore((s) => s.toggleCompleted);
  const setNodesCompleted = useWorkspaceStore((s) => s.setNodesCompleted);
  const startNoteEdit = useWorkspaceStore((s) => s.startNoteEdit);
  const deleteNodes = useWorkspaceStore((s) => s.deleteNodes);
  const duplicateNodes = useWorkspaceStore((s) => s.duplicateNodes);
  const setNodesType = useWorkspaceStore((s) => s.setNodesType);
  const setNodesViewMode = useWorkspaceStore((s) => s.setNodesViewMode);
  const setFoldDeep = useWorkspaceStore((s) => s.setFoldDeep);
  // 되돌리기가 없으므로, 하위 항목까지 사라지거나 여러 개를 한꺼번에 지울 때는 한 번 확인한다.
  const removeNodes = useCallback(
    (nodeIds: NodeId[]) => {
      const roots = selectActiveProject(useWorkspaceStore.getState()).rootNodes;
      const topmost = getTopmostNodeIds(roots, nodeIds);
      if (topmost.length === 0) return false;

      const hasChildren = topmost.some((id) => (findNode(roots, id)?.children.length ?? 0) > 0);
      const message =
        topmost.length > 1
          ? `불릿 ${topmost.length}개와 그 하위 항목을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.`
          : '이 불릿과 하위 항목을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.';
      if ((topmost.length > 1 || hasChildren) && !window.confirm(message)) return false;

      return deleteNodes(topmost);
    },
    [deleteNodes]
  );

  const removeNode = useCallback((item: FlattenedNode) => removeNodes([item.id]), [removeNodes]);

  const turnInto = useCallback(
    (nodeIds: NodeId[], option: TurnIntoOption) => {
      if (option === 'board') setNodesViewMode(nodeIds, 'board');
      else setNodesType(nodeIds, option);
    },
    [setNodesType, setNodesViewMode]
  );

  const setFoldAll = useCallback(
    (nodeIds: NodeId[], isFolded: boolean) => {
      nodeIds.forEach((id) => setFoldDeep(id, isFolded));
    },
    [setFoldDeep]
  );

  // 고른 불릿들과 그 하위를 들여쓴 목록 텍스트(.md) 파일로 내려받는다.
  const exportNodes = useCallback((nodeIds: NodeId[]) => {
    const roots = selectActiveProject(useWorkspaceStore.getState()).rootNodes;
    const nodes = getTopmostNodeIds(roots, nodeIds)
      .map((id) => findNode(roots, id))
      .filter((node): node is OutlineNode => node !== null);
    if (nodes.length === 0) return;

    const baseName = nodes[0].text.trim().replace(/[\\/:*?"<>|]/g, ' ').slice(0, 60) || 'outline';
    downloadTextFile(`${baseName}.md`, toOutlineText(nodes));
  }, []);

  // 이 불릿으로 곧장 들어오는 주소를 클립보드에 복사한다.
  const copyNodeLink = useCallback(async (nodeId: NodeId) => {
    const { activeProjectId } = useWorkspaceStore.getState().workspace;
    try {
      await navigator.clipboard.writeText(buildNodeLink(activeProjectId, nodeId));
    } catch (err) {
      console.error('링크 복사 실패:', err);
    }
  }, []);

  return {
    toggleCompleted,
    setNodesCompleted,
    startNoteEdit,
    duplicateNodes,
    turnInto,
    setFoldAll,
    exportNodes,
    copyNodeLink,
    removeNode,
    removeNodes,
  };
}
