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
import { useEditorApi, useEditorStore, useOutlineHost } from '../session/context';

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

export function useNodeActions() {
  const api = useEditorApi();
  const host = useOutlineHost();
  const toggleCompleted = useEditorStore((s) => s.toggleCompleted);
  const setNodesCompleted = useEditorStore((s) => s.setNodesCompleted);
  const startNoteEdit = useEditorStore((s) => s.startNoteEdit);
  const deleteNodes = useEditorStore((s) => s.deleteNodes);
  const duplicateNodes = useEditorStore((s) => s.duplicateNodes);
  const setNodesType = useEditorStore((s) => s.setNodesType);
  const setNodesViewMode = useEditorStore((s) => s.setNodesViewMode);
  const setFoldDeep = useEditorStore((s) => s.setFoldDeep);
  // 되돌리기가 없으므로, 하위 항목까지 사라지거나 여러 개를 한꺼번에 지울 때는 한 번 확인한다.
  const removeNodes = useCallback(
    async (nodeIds: NodeId[]): Promise<boolean> => {
      const roots = api.getState().getRoots();
      const topmost = getTopmostNodeIds(roots, nodeIds);
      if (topmost.length === 0) return false;

      const hasChildren = topmost.some((id) => (findNode(roots, id)?.children.length ?? 0) > 0);
      const message =
        topmost.length > 1
          ? `불릿 ${topmost.length}개와 그 하위 항목을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.`
          : '이 불릿과 하위 항목을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.';
      if ((topmost.length > 1 || hasChildren) && !(await host.confirm(message))) return false;

      return deleteNodes(topmost);
    },
    [api, host, deleteNodes]
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

  // 고른 불릿들과 그 하위를 들여쓴 목록 텍스트(.md) 파일로 내보낸다.
  const exportNodes = useCallback(
    (nodeIds: NodeId[]) => {
      const roots = api.getState().getRoots();
      const nodes = getTopmostNodeIds(roots, nodeIds)
        .map((id) => findNode(roots, id))
        .filter((node): node is OutlineNode => node !== null);
      if (nodes.length === 0) return;

      const baseName = nodes[0].text.trim().replace(/[\\/:*?"<>|]/g, ' ').slice(0, 60) || 'outline';
        host.exportText(`${baseName}.md`, toOutlineText(nodes));
    },
    [api, host]
  );

  // 이 불릿으로 곧장 들어오는 주소를 클립보드에 복사한다.
  const copyNodeLink = useCallback(
    async (nodeId: NodeId) => {
      try {
        await host.copyNodeLink(nodeId);
      } catch (err) {
        console.error('링크 복사 실패:', err);
      }
    },
    [host]
  );

  // 이 불릿의 마크다운 위키링크([[...#id]] 또는 ![[...#id]])를 클립보드에 복사한다.
  const copyWikilink = useCallback(
    async (nodeId: NodeId, embed = false) => {
      try {
        if (host.copyWikilink) {
          await host.copyWikilink(nodeId, embed);
        }
      } catch (err) {
        console.error('위키링크 복사 실패:', err);
      }
    },
    [host]
  );

  return {
    toggleCompleted,
    setNodesCompleted,
    startNoteEdit,
    duplicateNodes,
    turnInto,
    setFoldAll,
    exportNodes,
    copyNodeLink,
    copyWikilink,
    removeNode,
    removeNodes,
  };
}
