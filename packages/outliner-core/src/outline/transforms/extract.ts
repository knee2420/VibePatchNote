/**
 * @file extract.ts
 * @description 서브트리 추출(Extraction) 순수 함수
 * 하위 트리를 독립 프로젝트/블록으로 추출하고, 원본 위치에는 참조(Ref) 블록을 남기거나 정리한다.
 */

import type { NodeId, OutlineNode } from '../model/types';
import { findNode } from '../queries/find';

export interface ExtractSubtreeOptions {
  /** 원본 위치에 참조 블록을 남길 경우 주입할 ref 메타데이터 */
  placeholderRef?: OutlineNode['ref'];
  /** 원본 위치에 남길 대체 텍스트 (기본값: 원본 노드의 text) */
  placeholderText?: string;
  /** true일 경우 원본 위치에서 완전히 제거, false일 경우 참조 블록으로 치환 (기본값: false) */
  removeFromSource?: boolean;
}

export interface ExtractSubtreeResult {
  updatedRoots: OutlineNode[];
  extractedNode: OutlineNode | null;
}

/**
 * 트리에서 특정 노드(및 그 하위 서브트리)를 깊은 복사로 추출하고,
 * 원본 트리에는 참조 블록을 남기거나 노드를 제거한다.
 */
export function extractSubtree(
  rootNodes: OutlineNode[],
  targetNodeId: NodeId,
  options: ExtractSubtreeOptions = {}
): ExtractSubtreeResult {
  const target = findNode(rootNodes, targetNodeId);
  if (!target) {
    return { updatedRoots: rootNodes, extractedNode: null };
  }

  // 깊은 복사로 독립된 extractedNode 생성
  const extractedNode: OutlineNode = JSON.parse(JSON.stringify(target));

  function transformNodes(nodes: OutlineNode[]): OutlineNode[] {
    const result: OutlineNode[] = [];

    for (const node of nodes) {
      if (node.id === targetNodeId) {
        if (options.removeFromSource) {
          // 원본에서 완전 제거
          continue;
        }

        // 참조 블록으로 치환 (하위 children은 독립되었으므로 비움)
        const placeholder: OutlineNode = {
          ...node,
          text: options.placeholderText ?? node.text,
          children: [],
          isFolded: false,
          ref: options.placeholderRef ?? {
            type: 'project',
            targetProjectId: targetNodeId,
            displayText: options.placeholderText ?? node.text,
          },
          updatedAt: Date.now(),
        };
        result.push(placeholder);
      } else if (node.children.length > 0) {
        result.push({
          ...node,
          children: transformNodes(node.children),
        });
      } else {
        result.push(node);
      }
    }

    return result;
  }

  return {
    updatedRoots: transformNodes(rootNodes),
    extractedNode,
  };
}
