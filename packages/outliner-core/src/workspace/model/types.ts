/**
 * @file types.ts
 * @description [Macro 층위] 워크스페이스 & 프로젝트 & 버전 모델 타입 정의
 */

import type { OutlineFormatVersion } from '../../outline/model/version';
import type { NodeId, OutlineNode, ViewMode } from '../../outline/model/types';

export type WorkspaceId = string;
export type ProjectId = string;
export type SnapshotId = string;
export type MilestoneId = string;

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
  parentProjectId?: ProjectId | null;
  order?: number;
  meta?: ProjectMeta;
  createdAt: number;
  updatedAt: number;
}

/** 다중 프로젝트 및 워크스페이스 컨테이너 */
export interface Workspace {
  version: OutlineFormatVersion;
  id: WorkspaceId;
  title: string;
  projects: Record<ProjectId, Project>;
  activeProjectId: ProjectId;
  /** 프로젝트별 버전 스냅샷 목록 (최신이 맨 앞). 파일에 함께 영속화된다. */
  snapshots: Record<ProjectId, Snapshot[]>;
  createdAt: number;
  updatedAt: number;
}

/** 특정 시점의 불변 스냅샷 */
export interface Snapshot {
  id: SnapshotId;
  projectId: ProjectId;
  timestamp: number;
  milestoneName?: string;
  summary?: string;
  rootNodes: OutlineNode[];
}

/** 사용자가 지정한 주요 마일스톤 */
export interface Milestone {
  id: MilestoneId;
  projectId: ProjectId;
  name: string;
  snapshotId: SnapshotId;
  createdAt: number;
}

/** 참조 링크 정보 */
export interface ProjectRef {
  type: 'project' | 'block';
  targetProjectId: ProjectId;
  targetBlockId?: NodeId;
  displayText?: string;
}

/** 인라인 임베드 정보 */
export interface ProjectEmbed {
  type: 'embed';
  targetProjectId: ProjectId;
  targetBlockId?: NodeId;
}

/** 프로젝트 간의 연결망 및 백링크 그래프 */
export interface RelationsGraph {
  /** 내가 인용/참조하는 대상 목록 (source -> targets) */
  outbound: Record<ProjectId, Array<{ targetProjectId: ProjectId; targetBlockId?: NodeId }>>;
  /** 나를 인용/참조하는 출처 목록 (target -> sources) - 백링크 카운트 제공 */
  inbound: Record<ProjectId, Array<{ sourceProjectId: ProjectId; sourceBlockId: NodeId }>>;
}
