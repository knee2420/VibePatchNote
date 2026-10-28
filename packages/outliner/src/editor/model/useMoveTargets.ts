/**
 * @file useMoveTargets.ts
 * @description "이동" 대화상자에 보여줄 옮길 수 있는 대상 불릿 목록 계산 훅
 */

import { useMemo } from 'react';
import type { NodeId, OutlineNode } from '../../core';
import { useOutlineRoots } from '../session/context';

export interface MoveTarget {
  id: NodeId;
  text: string;
  depth: number;
  /** 상위 불릿들의 글자를 이은 경로 (어디에 있는 불릿인지 알아보기 위한 것) */
  trail: string;
}

/**
 * 옮기려는 불릿 자신과 그 하위를 뺀, 이 프로젝트의 모든 불릿을 문서 순서대로 돌려준다.
 * `query` 가 있으면 글자에 그 말이 들어간 것만 남긴다.
 */
export function useMoveTargets(sourceIds: NodeId[], query: string): MoveTarget[] {
  const rootNodes = useOutlineRoots();

  return useMemo(() => {
    const excluded = new Set(sourceIds);
    const needle = query.trim().toLowerCase();
    const targets: MoveTarget[] = [];

    function traverse(nodes: OutlineNode[], depth: number, trail: string[]) {
      for (const node of nodes) {
        if (excluded.has(node.id)) continue; // 자신과 그 하위로는 옮길 수 없다
        const label = node.text.trim() || '(빈 불릿)';
        if (node.nodeType !== 'divider' && (!needle || label.toLowerCase().includes(needle))) {
          targets.push({ id: node.id, text: label, depth, trail: trail.join(' › ') });
        }
        if (node.children.length > 0) traverse(node.children, depth + 1, [...trail, label]);
      }
    }
    traverse(rootNodes, 0, []);
    return targets;
  }, [rootNodes, sourceIds, query]);
}
