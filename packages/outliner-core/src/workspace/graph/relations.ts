/**
 * @file relations.ts
 * @description 프로젝트 간 상호 참조망 및 백링크(Inbound Links) 집계 순수 함수
 */

import type { NodeId, OutlineNode } from '../../outline/model/types';
import type { Project, ProjectId, RelationsGraph } from '../model/types';

/**
 * 프로젝트 내 모든 노드를 재귀 순회하며 참조/임베드 정보를 수집한다.
 */
function scanNodesForRefs(
  nodes: OutlineNode[],
  sourceProjectId: ProjectId,
  outboundList: Array<{ targetProjectId: ProjectId; targetBlockId?: NodeId }>,
  inboundMap: Record<ProjectId, Array<{ sourceProjectId: ProjectId; sourceBlockId: NodeId }>>
) {
  for (const node of nodes) {
    if (node.ref && node.ref.targetProjectId) {
      const targetId = node.ref.targetProjectId;
      outboundList.push({
        targetProjectId: targetId,
        targetBlockId: node.ref.targetBlockId,
      });

      if (!inboundMap[targetId]) {
        inboundMap[targetId] = [];
      }
      inboundMap[targetId].push({
        sourceProjectId,
        sourceBlockId: node.id,
      });
    }

    if (node.embed && node.embed.targetProjectId) {
      const targetId = node.embed.targetProjectId;
      outboundList.push({
        targetProjectId: targetId,
        targetBlockId: node.embed.targetBlockId,
      });

      if (!inboundMap[targetId]) {
        inboundMap[targetId] = [];
      }
      inboundMap[targetId].push({
        sourceProjectId,
        sourceBlockId: node.id,
      });
    }

    if (node.children.length > 0) {
      scanNodesForRefs(node.children, sourceProjectId, outboundList, inboundMap);
    }
  }
}

/**
 * 워크스페이스 내 모든 프로젝트 간의 연결망 및 백링크 관계를 집계한다.
 */
export function buildRelationsGraph(projects: Record<ProjectId, Project>): RelationsGraph {
  const outbound: Record<ProjectId, Array<{ targetProjectId: ProjectId; targetBlockId?: NodeId }>> = {};
  const inbound: Record<ProjectId, Array<{ sourceProjectId: ProjectId; sourceBlockId: NodeId }>> = {};

  for (const [projectId, project] of Object.entries(projects)) {
    outbound[projectId] = [];
    if (!inbound[projectId]) {
      inbound[projectId] = [];
    }
    scanNodesForRefs(project.rootNodes, projectId, outbound[projectId], inbound);
  }

  return {
    outbound,
    inbound,
  };
}

/**
 * 특정 프로젝트를 가리키는 백링크 총 개수를 반환한다.
 */
export function getBacklinkCount(graph: RelationsGraph, projectId: ProjectId): number {
  return graph.inbound[projectId]?.length ?? 0;
}
