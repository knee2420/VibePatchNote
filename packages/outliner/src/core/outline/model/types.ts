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
  /** 조상 노드 중 완료(isCompleted: true)된 노드가 있는지 여부 (Workflowy 스타일 하위 텍스트 흐림 상속) */
  isAncestorCompleted?: boolean;
}

/**
 * 대상 노드 기준으로 놓을 자리 (마우스 조작이 쓰는 말)
 * - before / after : 대상의 바로 위 / 바로 아래 형제
 * - inside         : 대상의 자식 맨 끝
 * - inside-start   : 대상의 자식 맨 앞
 */
export type DropPosition = 'before' | 'after' | 'inside' | 'inside-start';

/**
 * ID 트리의 노드 하나 (Workflowy 방식).
 * 중첩된 children 대신 부모·자식을 id 로만 가리킨다. 파일의 불릿이 가진 나머지 정보는 그대로 갖는다.
 * 부모·자식 연결은 패치 엔진(applyPatch) 한 곳에서만 고친다.
 */
export type FlatNode = Omit<OutlineNode, 'children'> & {
  /** 가상 뿌리 노드만 null 이다. 최상위 불릿의 부모는 가상 뿌리(ROOT_ID)다. */
  parentId: NodeId | null;
  childIds: NodeId[];
};

/**
 * ID 트리. 실행 중 불릿 트리의 원본이다.
 * 가상 뿌리 노드(ROOT_ID) 하나가 항상 들어 있고, 모든 불릿은 그 아래에 달린다.
 */
export interface FlatOutlineTree {
  nodes: ReadonlyMap<NodeId, FlatNode>;
}

/** 새로 만들 노드. id 와 만든 시각은 엔진이 정한다. (호출자가 id 를 정할 수 없다) */
export type FlatNodeInput = Omit<OutlineNode, 'id' | 'children' | 'createdAt' | 'updatedAt'> & {
  children?: FlatNodeInput[];
};

/**
 * 트리를 바꾸는 요청 하나. 위치는 숫자 인덱스가 아니라 "기준 노드의 뒤 / 앞 / 안"으로만 말한다.
 *
 * 앞의 일곱 가지는 Workflowy 의 패치 연산과 뜻이 같다.
 * - insert_after : 기준 노드 바로 뒤 형제로. `inside` 면 기준 노드의 맨 앞 자식으로.
 * - move         : 기준 노드(under)의 맨 앞 자식으로(기본). `inside: false` 면 기준 노드 바로 뒤 형제로.
 * - delete       : 하위가 있으면 `recursively` 없이는 거부한다.
 * 나머지(set_*)는 이 아웃라이너만의 필드(노트·종류·파일·보기 방식·접힘)를 고친다.
 */
export type TreePatchRequest =
  | { op: 'replace'; id: NodeId; text: string }
  | { op: 'complete'; id: NodeId }
  | { op: 'uncomplete'; id: NodeId }
  | { op: 'insert_after'; targetId: NodeId; items: FlatNodeInput[]; inside?: boolean }
  | { op: 'insert_before'; targetId: NodeId; items: FlatNodeInput[] }
  | { op: 'move'; ids: NodeId[]; under: NodeId; inside?: boolean }
  | { op: 'delete'; id: NodeId; recursively?: boolean }
  | { op: 'set_note'; id: NodeId; note?: string }
  | { op: 'set_node_type'; id: NodeId; nodeType: OutlineNodeType }
  | { op: 'set_file'; id: NodeId; file?: OutlineNodeFile }
  | { op: 'set_view_mode'; id: NodeId; viewMode?: ViewMode }
  | { op: 'set_fold'; id: NodeId; isFolded: boolean; deep?: boolean };

/** 요청 하나의 결과. 묶음 안의 요청은 서로 독립이라, 하나가 실패해도 나머지는 적용된다. */
export type TreePatchResult =
  | {
      ok: true;
      /** 삽입 요청이 만든 맨 위 단계 노드들 */
      createdIds?: NodeId[];
    }
  | { ok: false; error: string };

export interface TreePatchOutcome {
  /** 바뀐 것이 없으면 받은 트리 그대로(같은 객체)다. */
  tree: FlatOutlineTree;
  /** 요청과 같은 순서의 결과 */
  results: TreePatchResult[];
}
