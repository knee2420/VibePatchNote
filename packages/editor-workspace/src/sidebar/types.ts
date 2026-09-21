import type { ReactNode } from 'react';

/** 트리 노드 아이템 표준 인터페이스 */
export interface IdeTreeNodeItem {
  id: string;
  label: string;
  depth?: number;
  isFolder?: boolean;
  isOpen?: boolean;
  children?: IdeTreeNodeItem[];
  icon?: ReactNode;
  badge?: ReactNode;
  subtitle?: string;
  disabled?: boolean;
  data?: unknown;
}

/** 캔버스 물리 세그먼트 블록 데이터 */
export interface IdeSegmentBlockData {
  id: string;
  blockIndex?: number;
  label: string;
  segmentType?: 'header' | 'table' | 'body' | 'image' | 'list' | 'meta' | string;
  pageNumber?: number;
  description?: string;
  fields?: IdeSegmentFieldData[];
  data?: unknown;
}

/** 세그먼트 블록 하위 매핑 필드 데이터 (1:N 복수 매핑 지원) */
export interface IdeSegmentFieldData {
  id: string;
  fieldName: string;
  fieldKey?: string;
  value?: string;
  status?: 'unbound' | 'suggested' | 'bound' | 'custom';
  suggestedValue?: string;
  confidence?: string;
  resourceName?: string;
  sourceLocation?: string;
  data?: unknown;
}

/** 순수 아웃라인 목차 데이터 (헤딩 계층 구조) */
export interface IdeOutlineItemData {
  id: string;
  title: string;
  level: number; // 1 = H1, 2 = H2, 3 = H3, ...
  pageNumber?: number;
  sectionIndex?: number;
  children?: IdeOutlineItemData[];
  data?: unknown;
}

/** 계층 결합 노드 (목차 ➔ 세그먼트 ➔ 필드 통합 트리용) */
export interface IdeHierarchyNode {
  id: string;
  kind: 'outline' | 'segment' | 'field' | 'file' | string;
  title: string;
  depth?: number;
  level?: number; // outline 레벨 (H1, H2, H3)
  pageNumber?: number;
  segmentType?: string; // header, table, image, body 등
  fieldData?: IdeSegmentFieldData;
  fields?: IdeSegmentFieldData[]; // 세그먼트에 속한 복수 필드들
  children?: IdeHierarchyNode[];
  data?: unknown;
}

/** 계층 트리 프로젝션 모드 */
export type HierarchyProjectionMode = 'hierarchical' | 'outline' | 'segments';

/** 사이드바 뷰 모드 */
export type SidebarViewMode = 'outline' | 'segments' | 'explorer' | 'hierarchical' | string;

/** 레퍼런스 문서 데이터 기본 인터페이스 */
export interface ReferenceDocumentItem {
  id: string;
  name: string;
  format?: string;
  path?: string;
  size?: string;
  updatedAt?: string;
  description?: string;
}

/** react-arborist 표준 노드 데이터 규격 */
export interface IdeArboristNodeData {
  id: string;
  name: string;
  isInternal?: boolean;
  children?: IdeArboristNodeData[];
  kind: 'page' | 'outline' | 'segment' | 'slot' | 'file';
  level?: number;
  pageNumber?: number;
  segmentType?: string;
  fieldData?: IdeSegmentFieldData;
  badge?: string | number;
  data?: unknown;
}

