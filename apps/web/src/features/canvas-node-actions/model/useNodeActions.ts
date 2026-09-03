import { useCallback } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import type { NodeTheme } from '@/shared/model';

export function useNodeActions() {
  const nodes = useCanvasBoardStore((s) => s.nodes);
  const setNodes = useCanvasBoardStore((s) => s.setNodes);
  const removeNodes = useCanvasBoardStore((s) => s.removeNodes);

  const selectedNodes = nodes.filter((n) => n.selected);
  const targetNodes = selectedNodes.length > 0 ? selectedNodes : nodes;

  // 1. 🔲 자동 그리드 정렬 (바둑판 일괄 재배치)
  const arrangeInGrid = useCallback(() => {
    if (targetNodes.length === 0) return;

    // Determine bounds and starting anchor
    const minX = Math.min(...targetNodes.map((n) => n.position.x));
    const minY = Math.min(...targetNodes.map((n) => n.position.y));

    // Determine grid columns: 2 to 4 columns depending on count
    const total = targetNodes.length;
    const cols = total <= 2 ? total : total <= 4 ? 2 : 3;

    // Sizing estimates with fallback
    const colWidth = 620; // Reference documents are 600px wide
    const rowHeight = 840; // Reference documents are 800px tall
    const gap = 40;

    const targetIdSet = new Set(targetNodes.map((n) => n.id));

    setNodes((currentNodes) => {
      let targetIndex = 0;
      return currentNodes.map((node) => {
        if (!targetIdSet.has(node.id)) return node;

        const col = targetIndex % cols;
        const row = Math.floor(targetIndex / cols);
        targetIndex++;

        return {
          ...node,
          position: {
            x: minX + col * (colWidth + gap),
            y: minY + row * (rowHeight + gap),
          },
        };
      });
    });
  }, [targetNodes, setNodes]);

  // 2. ↔️ 수평 균등 배분 (Distribute Horizontally)
  const distributeHorizontally = useCallback(() => {
    if (targetNodes.length <= 1) return;

    // Sort by current X position
    const sorted = [...targetNodes].sort((a, b) => a.position.x - b.position.x);
    const startX = sorted[0].position.x;
    const fixedY = sorted[0].position.y;
    const stride = 640; // 600px width + 40px gap

    const positionMap = new Map<string, { x: number; y: number }>();
    sorted.forEach((node, index) => {
      positionMap.set(node.id, {
        x: startX + index * stride,
        y: fixedY,
      });
    });

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const newPos = positionMap.get(node.id);
        return newPos ? { ...node, position: newPos } : node;
      })
    );
  }, [targetNodes, setNodes]);

  // 3. ↕️ 수직 균등 배분 (Distribute Vertically)
  const distributeVertically = useCallback(() => {
    if (targetNodes.length <= 1) return;

    // Sort by current Y position
    const sorted = [...targetNodes].sort((a, b) => a.position.y - b.position.y);
    const fixedX = sorted[0].position.x;
    const startY = sorted[0].position.y;
    const stride = 840; // 800px height + 40px gap

    const positionMap = new Map<string, { x: number; y: number }>();
    sorted.forEach((node, index) => {
      positionMap.set(node.id, {
        x: fixedX,
        y: startY + index * stride,
      });
    });

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const newPos = positionMap.get(node.id);
        return newPos ? { ...node, position: newPos } : node;
      })
    );
  }, [targetNodes, setNodes]);

  // 4. 🎨 카드 테마 색상 일괄 변경
  const changeNodeTheme = useCallback(
    (theme: NodeTheme) => {
      const targetIdSet = new Set(targetNodes.map((n) => n.id));
      if (targetIdSet.size === 0) return;

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (!targetIdSet.has(node.id)) return node;
          return {
            ...node,
            data: {
              ...node.data,
              theme,
            },
          };
        })
      );
    },
    [targetNodes, setNodes]
  );

  // 5. 🗑️ 선택 카드 일괄 삭제 (확인창 노출은 UI 책임)
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    removeNodes(selectedNodes.map((n) => n.id));
  }, [selectedNodes, removeNodes]);

  // Deselect all nodes
  const deselectAll = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((n) => (n.selected ? { ...n, selected: false } : n))
    );
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
