/**
 * @file types.ts
 * @description 아웃라인 도메인 엔티티 및 값 객체 타입 정의 (AST 원본 규격)
 */

import type { OutlineFormatVersion } from './version';

export type NodeId = string;

/** 뷰 모드: 불릿 아웃라인 뷰 vs 칸반 보드 뷰 */
export type ViewMode = 'bullets' | 'board';

/** 노드 스타일/의미적 타입 */
export type OutlineNodeType =
  | 'bullet'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'todo'
  | 'code'
  | 'quote'
  | 'paragraph'
  | 'divider';

export interface OutlineNode {
  id: NodeId;
  text: string;
  children: OutlineNode[];
  isFolded?: boolean;

  /** 노드 서식/포맷 (기본값: 'bullet') */
  nodeType?: OutlineNodeType;

  /** 완료 여부 (To-do 및 일반 불릿 완료 처리) */
  isCompleted?: boolean;
  completedAt?: number;

  /** 하위 노드가 아닌 자체 부연 설명문 (Shift+Enter 노트) */
  note?: string;

  /** 해당 노드에 줌인했을 때 적용할 로컬 뷰 모드 (선택적) */
  viewMode?: ViewMode;

  /** 타 프로젝트 또는 외부 블록 참조 링크 */
  ref?: {
    type: 'project' | 'block';
    targetProjectId: string;
    targetBlockId?: string;
    displayText?: string;
    relation?: 'child' | 'standalone';
  };

  /** 타 프로젝트 블록 인라인 미러링/임베드 */
  embed?: {
    type: 'embed';
    targetProjectId: string;
    targetBlockId?: string;
  };

  createdAt?: number;
  updatedAt?: number;
}

/** 오픈소스 표준 단일 불릿 블록 별칭 */
export type Block = OutlineNode;

export interface OutlineDocument {
  version: OutlineFormatVersion;
  id: string;
  title: string;
  rootNodes: OutlineNode[];

  /** 문서 기본 뷰 모드 (기본값: 'bullets') */
  defaultView?: ViewMode;

  createdAt: number;
  updatedAt: number;
}

/** 렌더러에 공급하기 위한 가상화/순회용 평탄화(Flat) 노드 표현 (views/types.ts 와 호환) */
export interface FlattenedNode {
  id: NodeId;
  node: OutlineNode;
  depth: number;
  parentId: NodeId | null;
  hasChildren: boolean;
  isFolded: boolean;
  path: NodeId[];
}
