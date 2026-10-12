/**
 * @file extractToProject.ts
 * @description 서브트리를 독립 프로젝트로 승격/추출(Extract)하는 순수 함수
 */

import { generateNodeId } from '../../outline/model/id';
import { getPath } from '../../outline/queries/path';
import { extractSubtree } from '../../outline/transforms/extract';
import type { NodeId } from '../../outline/model/types';
import type { Project, ProjectId } from '../model/types';

export interface ExtractToProjectResult {
  updatedSourceProject: Project;
  newProject: Project;
}

export interface ExtractToProjectOptions {
  title?: string;
  mode?: 'child' | 'standalone';
  parentProjectId?: ProjectId | null;
}

/**
 * 소스 프로젝트의 특정 노드와 하위 트리를 프로젝트로 추출하고,
 * 원본 위치에는 해당 신규 프로젝트를 가리키는 참조(Ref) 블록을 남긴다.
 * - mode === 'child': 소스 프로젝트의 하위 프로젝트(parentProjectId 설정)로 분기
 * - mode === 'standalone': 최상위 독립 프로젝트로 분기
 */
export function extractToProject(
  sourceProject: Project,
  targetNodeId: NodeId,
  options?: string | ExtractToProjectOptions
): ExtractToProjectResult | null {
  const newProjectId = generateNodeId();
  const now = Date.now();

  const titleArg = typeof options === 'string' ? options : options?.title;
  const mode: 'child' | 'standalone' =
    typeof options === 'object' && options?.mode ? options.mode : 'child';

  // 1. 임시 추출로 노드 정보 파악
  const { extractedNode } = extractSubtree(sourceProject.rootNodes, targetNodeId);
  if (!extractedNode) {
    return null;
  }

  const finalTitle = titleArg ?? (extractedNode.text.trim() || '추출된 프로젝트');

  // 2. 소스 프로젝트의 원본 위치에 참조 블록 심기
  const { updatedRoots } = extractSubtree(sourceProject.rootNodes, targetNodeId, {
    placeholderText: finalTitle,
    placeholderRef: {
      type: 'project',
      targetProjectId: newProjectId,
      displayText: finalTitle,
      relation: mode,
    },
  });

  const updatedSourceProject: Project = {
    ...sourceProject,
    rootNodes: updatedRoots,
    updatedAt: now,
  };

  // 3. 스마트 부모 프로젝트 판별 (조상 경로 상의 최근 상위 프로젝트 참조 감지)
  let resolvedParentId: ProjectId | null = null;
  const explicitParentId =
    typeof options === 'object' ? options?.parentProjectId : undefined;

  if (explicitParentId !== undefined) {
    resolvedParentId = explicitParentId;
  } else if (mode === 'child') {
    // 기본값: 현재 소스 프로젝트
    resolvedParentId = sourceProject.id;

    // 조상 경로(Ancestors)를 상향 역순 탐색하여 최근 프로젝트 참조가 있는지 확인
    const nodePath = getPath(sourceProject.rootNodes, targetNodeId);
    const ancestors = nodePath.slice(0, -1);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (
        ancestor.ref?.type === 'project' &&
        ancestor.ref.targetProjectId &&
        ancestor.ref.targetProjectId !== sourceProject.id
      ) {
        resolvedParentId = ancestor.ref.targetProjectId;
        break;
      }
    }
  }

  // 4. 신규 프로젝트 생성 (추출된 노드의 자식들을 루트로 배치하거나, 추출된 노드 자체를 루트로)
  const newProjectRootNodes =
    extractedNode.children.length > 0
      ? extractedNode.children
      : [
          {
            ...extractedNode,
            id: generateNodeId(),
          },
        ];

  const newProject: Project = {
    id: newProjectId,
    title: finalTitle,
    parentProjectId: resolvedParentId,
    rootNodes: newProjectRootNodes,
    defaultView: extractedNode.viewMode ?? sourceProject.defaultView ?? 'bullets',
    meta: {
      description:
        mode === 'child'
          ? `프로젝트 '${sourceProject.title}'의 하위 프로젝트로 생성됨`
          : `프로젝트 '${sourceProject.title}'에서 별도 독립 프로젝트로 추출됨`,
      tags: mode === 'child' ? ['subproject'] : ['standalone'],
    },
    createdAt: now,
    updatedAt: now,
  };

  return {
    updatedSourceProject,
    newProject,
  };
}
