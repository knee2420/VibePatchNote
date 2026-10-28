import { useCallback, useMemo } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import type { NodeTheme } from '@/shared/model';

import {
  applyPositions,
  calcGridPositions,
  calcHorizontalPositions,
  calcVerticalPositions,
} from '../lib/nodeArrangement';

/**
 * 캔버스 노드 일괄 정렬/테마/삭제 액션.
 *
 * 선택된 노드가 있으면 그 노드들만, 없으면 전체를 대상으로 합니다.
 * 위치 계산은 `lib/nodeArrangement.ts` 의 순수 함수가 담당합니다.
 */
export function useNodeActions() {
  const nodes = useCanvasBoardStore((s) => s.nodes);
  const setNodes = useCanvasBoardStore((s) => s.setNodes);
  const removeNodes = useCanvasBoardStore((s) => s.removeNodes);

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const targetNodes = selectedNodes.length > 0 ? selectedNodes : nodes;

  const arrangeInGrid = useCallback(() => {
    const positions = calcGridPositions(targetNodes);
    setNodes((current) => applyPositions(current, positions));
  }, [targetNodes, setNodes]);

  const distributeHorizontally = useCallback(() => {
    const positions = calcHorizontalPositions(targetNodes);
    setNodes((current) => applyPositions(current, positions));
  }, [targetNodes, setNodes]);

  const distributeVertically = useCallback(() => {
    const positions = calcVerticalPositions(targetNodes);
    setNodes((current) => applyPositions(current, positions));
  }, [targetNodes, setNodes]);

  const changeNodeTheme = useCallback(
    (theme: NodeTheme) => {
      const targetIds = new Set(targetNodes.map((n) => n.id));
      if (targetIds.size === 0) return;

      setNodes((current) =>
        current.map((node) =>
          targetIds.has(node.id) ? { ...node, data: { ...node.data, theme } } : node
        )
      );
    },
    [targetNodes, setNodes]
  );

  /** 확인창 노출은 UI 책임입니다. 훅은 헤드리스로 유지합니다. */
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    removeNodes(selectedNodes.map((n) => n.id));
  }, [selectedNodes, removeNodes]);

  const deselectAll = useCallback(() => {
    setNodes((current) => current.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }, [setNodes]);

  return {
    nodes,
    selectedNodes,
    hasSelection: selectedNodes.length > 0,
    selectedCount: selectedNodes.length,
    arrangeInGrid,
    distributeHorizontally,
    distributeVertically,
    changeNodeTheme,
    deleteSelected,
    deselectAll,
  };
}
