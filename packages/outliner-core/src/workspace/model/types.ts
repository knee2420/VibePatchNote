/**
 * @file types.ts
 * @description [Macro 층위] 워크스페이스 & 프로젝트 모델 타입 정의
 *
 * 워크스페이스는 폴더 하나에 해당하고, 그 안의 프로젝트들은 서로 나란히 놓인 단건이다.
 * 프로젝트 사이의 포함 관계·연결·버전 이력은 두지 않는다. (이력은 폴더를 git 으로 관리한다)
 */

import type { OutlineFormatVersion } from '../../outline/model/version';
import type { OutlineNode, ViewMode } from '../../outline/model/types';

export type WorkspaceId = string;
export type ProjectId = string;

/** 프로젝트 메타데이터 (설명, 색상, 태그 등) */
export interface ProjectMeta {
  description?: string;
  tags?: string[];
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

/** 단일 프로젝트 엔티티 (독립된 아웃라인 트리 소유) */
export interface Project {
  id: ProjectId;
  title: string;
  rootNodes: OutlineNode[];
  defaultView?: ViewMode;
  order?: number;
  meta?: ProjectMeta;
  createdAt: number;
  updatedAt: number;
}

/** 프로젝트들을 담는 워크스페이스 컨테이너 */
export interface Workspace {
  version: OutlineFormatVersion;
  id: WorkspaceId;
  title: string;
  projects: Record<ProjectId, Project>;
  activeProjectId: ProjectId;
  createdAt: number;
  updatedAt: number;
}
