/**
 * @file snapshot.ts
 * @description 온디맨드 버전 스냅샷 및 마일스톤 관리 순수 함수
 */

import { generateNodeId } from '../../outline/model/id';
import type { Milestone, Project, Snapshot } from '../model/types';

/**
 * 프로젝트의 현재 불릿 트리 상태를 불변 스냅샷으로 캡처한다.
 */
export function createSnapshot(
  project: Project,
  options: { milestoneName?: string; summary?: string } = {}
): Snapshot {
  return {
    id: generateNodeId(),
    projectId: project.id,
    timestamp: Date.now(),
    milestoneName: options.milestoneName,
    summary: options.summary,
    // 깊은 복사로 당시 상태를 불변 보존
    rootNodes: JSON.parse(JSON.stringify(project.rootNodes)),
  };
}

/**
 * 특정 스냅샷의 불릿 트리 상태로 프로젝트를 롤백/복원한다.
 */
export function restoreSnapshot(currentProject: Project, snapshot: Snapshot): Project {
  return {
    ...currentProject,
    rootNodes: JSON.parse(JSON.stringify(snapshot.rootNodes)),
    updatedAt: Date.now(),
  };
}

/**
 * 특정 스냅샷에 마일스톤 명칭을 박제(Pin)한다.
 */
export function createMilestone(
  projectId: string,
  name: string,
  snapshotId: string
): Milestone {
  return {
    id: generateNodeId(),
    projectId,
    name,
    snapshotId,
    createdAt: Date.now(),
  };
}
