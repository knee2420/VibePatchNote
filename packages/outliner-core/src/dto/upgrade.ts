/**
 * @file upgrade.ts
 * @description 구버전 파일 규격을 최신 Workspace 로 승격하는 순수 함수
 */

import { generateNodeId } from '../outline/model/id';
import type { OutlineDocument } from '../outline/model/types';
import { OUTLINE_FORMAT_VERSION } from '../outline/model/version';
import type { Project, Workspace } from '../workspace/model/types';

/**
 * 단일 OutlineDocument 를 "프로젝트 1개짜리 Workspace" 로 승격한다.
 * 문서의 id 가 그대로 프로젝트 id 가 되고, 스키마가 모르는 필드도 프로젝트에 보존한다.
 */
export function upgradeDocumentToWorkspace(doc: OutlineDocument): Workspace {
  const { version: _version, ...projectFields } = doc;
  const project: Project = { ...projectFields };

  return {
    version: OUTLINE_FORMAT_VERSION,
    id: generateNodeId(),
    title: doc.title,
    projects: { [project.id]: project },
    activeProjectId: project.id,
    snapshots: {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
