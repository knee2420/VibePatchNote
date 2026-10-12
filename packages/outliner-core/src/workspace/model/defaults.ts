/**
 * @file defaults.ts
 * @description 워크스페이스 및 프로젝트 기본 팩토리 함수
 */

import { generateNodeId } from '../../outline/model/id';
import { OUTLINE_FORMAT_VERSION } from '../../outline/model/version';
import type { OutlineNode } from '../../outline/model/types';
import { createSnapshot } from '../history/snapshot';
import type { Project, Workspace } from './types';

/**
 * 기본 프로젝트 생성
 */
export function createDefaultProject(
  title: string = '새 프로젝트',
  initialNodes?: OutlineNode[]
): Project {
  const now = Date.now();
  const defaultNodes: OutlineNode[] = initialNodes ?? [
    {
      id: generateNodeId(),
      text: `${title} 개요`,
      children: [
        {
          id: generateNodeId(),
          text: '핵심 아이디어와 생각의 흐름을 여기에 작성하세요',
          children: [],
          isFolded: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      isFolded: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    id: generateNodeId(),
    title,
    rootNodes: defaultNodes,
    defaultView: 'bullets',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 기본 워크스페이스 생성 (1개의 기본 프로젝트 + 그 초기 스냅샷 포함)
 */
export function createEmptyWorkspace(title: string = '내 워크스페이스'): Workspace {
  const now = Date.now();
  const initialProject = createDefaultProject('메인 기획');

  return {
    version: OUTLINE_FORMAT_VERSION,
    id: generateNodeId(),
    title,
    projects: {
      [initialProject.id]: initialProject,
    },
    activeProjectId: initialProject.id,
    snapshots: {
      [initialProject.id]: [
        createSnapshot(initialProject, {
          milestoneName: 'v0.1 초안',
          summary: '프로젝트 생성 초기 스냅샷',
        }),
      ],
    },
    createdAt: now,
    updatedAt: now,
  };
}
