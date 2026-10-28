/**
 * @file buildExportFile.ts
 * @description Workspace + 내보내기 요청 -> 내보낼 파일 하나 (순수 함수)
 *
 * 프로젝트 전체는 그 프로젝트 그대로, 일부 범위는 새 id 의 프로젝트로 떠내서 파일로 만든다.
 */

import {
  type OutlineNode,
  type Project,
  type Workspace,
  findNode,
  generateNodeId,
  getTopmostNodeIds,
} from '../../core';
import { countNodes } from '../project/countNodes';
import { PROJECT_FILE_EXTENSION, serializeProjectFile } from '../project/projectFile';
import { toVaultFileBase } from '../vault/fileName';
import type { ExportFile, ExportRequest, ExportScope } from './exportTypes';

const UNTITLED = '제목 없음';

function cloneNodes(nodes: OutlineNode[]): OutlineNode[] {
  return JSON.parse(JSON.stringify(nodes));
}

/** 프로젝트의 일부를 새 프로젝트로 떠낸다. 원본은 건드리지 않고, 새 id 를 준다. */
function carveProject(
  source: Project,
  title: string,
  rootNodes: OutlineNode[],
  view = source.defaultView
): Project {
  const now = Date.now();
  return {
    id: generateNodeId(),
    title: title.trim() || UNTITLED,
    rootNodes: cloneNodes(rootNodes),
    ...(view ? { defaultView: view } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/** 요청한 범위를 파일 하나에 담을 프로젝트로 만든다. 범위를 찾지 못하면 null */
function buildProject(source: Project, scope: ExportScope): Project | null {
  if (scope.kind === 'project') return source;

  if (scope.kind === 'subtree') {
    const node = findNode(source.rootNodes, scope.nodeId);
    if (!node) return null;
    return carveProject(source, node.text, node.children, node.viewMode ?? source.defaultView);
  }

  const nodes = getTopmostNodeIds(source.rootNodes, scope.nodeIds)
    .map((id) => findNode(source.rootNodes, id))
    .filter((node): node is OutlineNode => node !== null);
  if (nodes.length === 0) return null;
  return carveProject(source, nodes[0].text, nodes);
}

/**
 * 내보낼 파일을 만든다. 프로젝트나 범위를 찾지 못하면 null
 */
export function buildExportFile(workspace: Workspace, request: ExportRequest): ExportFile | null {
  const source = workspace.projects[request.projectId];
  if (!source) return null;

  const project = buildProject(source, request.scope);
  if (!project) return null;

  return {
    fileName: `${toVaultFileBase(project.title)}${PROJECT_FILE_EXTENSION}`,
    text: serializeProjectFile(project),
    title: project.title,
    nodeCount: countNodes(project.rootNodes),
  };
}
