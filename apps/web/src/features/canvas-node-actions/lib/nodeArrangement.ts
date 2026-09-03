import type { Node, XYPosition } from '@xyflow/react';

import { REFERENCE_CARD_SIZE } from '@/entities/reference-document';

/** 카드 사이 여백(px). */
const CARD_GAP = 40;

/** 바둑판 정렬은 카드 사이를 조금 더 벌립니다. */
const GRID_COL_WIDTH = REFERENCE_CARD_SIZE.width + 20;
const GRID_ROW_HEIGHT = REFERENCE_CARD_SIZE.height + CARD_GAP;

/** 균등 배분 시 한 칸 간격. */
const HORIZONTAL_STRIDE = REFERENCE_CARD_SIZE.width + CARD_GAP;
const VERTICAL_STRIDE = REFERENCE_CARD_SIZE.height + CARD_GAP;

export type PositionMap = Map<string, XYPosition>;

/** 개수에 따라 2~3열을 고릅니다. */
function pickColumnCount(total: number): number {
  if (total <= 2) return total;
  if (total <= 4) return 2;
  return 3;
}

/** 선택된 노드들을 좌상단 기준 바둑판으로 재배치합니다. */
export function calcGridPositions(targets: Node[]): PositionMap {
  const positions: PositionMap = new Map();
  if (targets.length === 0) return positions;

  const minX = Math.min(...targets.map((n) => n.position.x));
  const minY = Math.min(...targets.map((n) => n.position.y));
  const cols = pickColumnCount(targets.length);

  targets.forEach((node, index) => {
    positions.set(node.id, {
      x: minX + (index % cols) * (GRID_COL_WIDTH + CARD_GAP),
      y: minY + Math.floor(index / cols) * (GRID_ROW_HEIGHT + CARD_GAP),
    });
  });

  return positions;
}

/** 현재 X 순서를 유지한 채 가로로 균등 배분합니다. */
export function calcHorizontalPositions(targets: Node[]): PositionMap {
  const positions: PositionMap = new Map();
  if (targets.length <= 1) return positions;

  const sorted = [...targets].sort((a, b) => a.position.x - b.position.x);
  const startX = sorted[0].position.x;
  const fixedY = sorted[0].position.y;

  sorted.forEach((node, index) => {
    positions.set(node.id, { x: startX + index * HORIZONTAL_STRIDE, y: fixedY });
  });

  return positions;
}

/** 현재 Y 순서를 유지한 채 세로로 균등 배분합니다. */
export function calcVerticalPositions(targets: Node[]): PositionMap {
  const positions: PositionMap = new Map();
  if (targets.length <= 1) return positions;

  const sorted = [...targets].sort((a, b) => a.position.y - b.position.y);
  const fixedX = sorted[0].position.x;
  const startY = sorted[0].position.y;

  sorted.forEach((node, index) => {
    positions.set(node.id, { x: fixedX, y: startY + index * VERTICAL_STRIDE });
  });

  return positions;
}

/** 계산된 위치 맵을 전체 노드 배열에 적용합니다. */
export function applyPositions(nodes: Node[], positions: PositionMap): Node[] {
  if (positions.size === 0) return nodes;
  return nodes.map((node) => {
    const next = positions.get(node.id);
    return next ? { ...node, position: next } : node;
  });
}
