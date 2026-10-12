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

/**
 * 불릿에 딸린 파일을 얼마나 크게 보일지: 제목만 / 작게 / 크게.
 * 파일마다 정하지 않는다. 호스트의 설정이 종류(이미지·PDF 등)별로 정한다.
 */
export type FileDisplay = 'title' | 'small' | 'large';

/**
 * 불릿에 딸린 파일 하나. 파일 내용은 담지 않고 주소만 갖는다.
 * 어떤 종류(이미지·PDF 등)인지는 저장하지 않는다. 주소의 확장자를 보고 그때그때 정한다.
 */
export interface OutlineNodeFile {
  /** 파일의 주소. 옵시디언 링크 주소 꼴(`자료/설계.pdf`, `그림.png`)이거나 웹 주소 */
  target: string;
  /** 그 종류만의 옵션 (예: PDF 의 시작 쪽). 모양은 종류가 정한다. */
  options?: Record<string, unknown>;
}

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

  /** 이 불릿에 딸린 파일 (불릿 하나에 파일 하나) */
  file?: OutlineNodeFile;

  /** 해당 노드에 줌인했을 때 적용할 로컬 뷰 모드 (선택적) */
  viewMode?: ViewMode;

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
