/**
 * @file syncRef.ts
 * @description 불릿 트리 내 프로젝트 참조(ProjectRef) 노드의 양방향 정합성 동기화 순수 함수
 * - 프로젝트 제목 변경 시 트리 내 참조 블록 일괄 갱신
 * - 프로젝트 삭제 시 깨진 링크(Dangling Reference) 안전 해제
 * - 하위 프로젝트 생성 시 부모 트리 맨 위 단계 끝에 참조 블록 삽입
 * - 트리가 가리키는 프로젝트 목록 수집 (참조 블록이 사라졌는지 판별용)
 */

import { produce } from 'immer';
import { generateNodeId } from '../../outline/model/id';
import type { OutlineNode } from '../../outline/model/types';

/**
 * 트리 내에서 특정 프로젝트를 가리키는 모든 참조 블록의 text 및 displayText를 일괄 갱신
 */
export function updateProjectRefTextInNodes(
  nodes: OutlineNode[],
  targetProjectId: string,
  newTitle: string
): OutlineNode[] {
  const finalTitle = newTitle.trim() || '제목 없는 프로젝트';

  return produce(nodes, (draft) => {
    function traverse(currentNodes: OutlineNode[]) {
      for (const node of currentNodes) {
        if (node.ref?.type === 'project' && node.ref.targetProjectId === targetProjectId) {
          node.text = finalTitle;
          node.ref.displayText = finalTitle;
          node.updatedAt = Date.now();
        }
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    }
    traverse(draft as OutlineNode[]);
  });
}

/**
 * 삭제된 프로젝트를 참조하고 있던 불릿들의 깨진 링크를 안전하게 해제 (일반 불릿으로 보존)
 */
export function cleanupProjectRefsInNodes(
  nodes: OutlineNode[],
  deletedProjectId: string
): OutlineNode[] {
  return produce(nodes, (draft) => {
    function traverse(currentNodes: OutlineNode[]) {
      for (const node of currentNodes) {
        if (node.ref?.type === 'project' && node.ref.targetProjectId === deletedProjectId) {
          node.ref = undefined;
          node.updatedAt = Date.now();
        }
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    }
    traverse(draft as OutlineNode[]);
  });
}

/**
 * 부모 트리의 맨 위 단계 끝에 하위 프로젝트 참조 노드를 넣는다.
 * 프로젝트 탐색기에서 "부모 바로 아래"인 프로젝트는 부모의 아웃라인에서도 맨 위 단계에 보여야 한다.
 * (특정 불릿 자리에 하위 프로젝트를 두는 일은 그 불릿을 추출하는 쪽이 맡는다)
 */
export function insertChildProjectRef(
  rootNodes: OutlineNode[],
  refNode: OutlineNode
): OutlineNode[] {
  return [...rootNodes, refNode];
}

/**
 * 하위 프로젝트를 가리키는 참조 블록을 만든다.
 */
export function createChildProjectRefNode(projectId: string, title: string): OutlineNode {
  const now = Date.now();
  return {
    id: generateNodeId(),
    text: title,
    children: [],
    ref: {
      type: 'project',
      targetProjectId: projectId,
      displayText: title,
      relation: 'child',
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 트리 안의 참조 블록들이 가리키는 프로젝트 id 를 모두 모은다.
 */
export function collectProjectRefTargets(nodes: OutlineNode[]): Set<string> {
  const targets = new Set<string>();
  function traverse(currentNodes: OutlineNode[]) {
    for (const node of currentNodes) {
      if (node.ref?.type === 'project') targets.add(node.ref.targetProjectId);
      if (node.children.length > 0) traverse(node.children);
    }
  }
  traverse(nodes);
  return targets;
}
