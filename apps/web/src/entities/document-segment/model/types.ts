/**
 * 세그먼트 도메인의 화면 모델.
 *
 * **뷰어 패키지 계약과 다르다.** 여기 있는 `box_2d` / `content_summary` 는 백엔드
 * 직렬화 규약이고, `@vibe/document-viewer` 는 호스트 중립 계약(`box` / `summary`)을
 * 쓴다. 둘을 잇는 변환은 `toViewerSegment.ts` 한 곳에만 둔다.
 */
export interface DocumentSegmentItem {
  id: string;
  page: number;
  type: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0~1000
  content_summary?: string;
}

export interface SegmentArtifactResponse {
  status: string;
  docId: string;
  documentTitle: string;
  totalPages: number;
  artifactId?: string | null;
  segments: DocumentSegmentItem[];
  agentRunId?: string;
}

export interface SegmentStructureTarget {
  id: string;
  page: number;
  label: string;
  type: string;
  box_2d?: [number, number, number, number] | null;
  artifactId?: string | null;
  scaffoldId?: string | null;
}

export interface SegmentMappingItem {
  targetKind: 'outline_element' | 'wireframe_block';
  targetId: string;
  primarySegmentId?: string | null;
  confidence: number;
  source: 'algorithm' | 'override' | 'unassigned';
  reason: string;
}

export interface SegmentStructureResponse {
  docId: string;
  segmentArtifactId?: string | null;
  outlineArtifactId?: string | null;
  segments: DocumentSegmentItem[];
  outlineElements: SegmentStructureTarget[];
  wireframeBlocks: SegmentStructureTarget[];
  mappings: SegmentMappingItem[];
  staleOverrideIds: string[];
  mappingEngineVersion: string;
}

export type RelationshipTargetKind = 'outline_element' | 'wireframe_block';

/**
 * 트리에서 고른 구조 대상의 최소 표현.
 *
 * 아웃라인 엔티티의 타입을 직접 가져오지 않는다 — 같은 레이어끼리 참조하면 두
 * 슬라이스가 함께 굳는다. 선택 사실을 전달하는 데 필요한 필드만 여기서 정의하고,
 * 조합하는 쪽이 자기 모델로 옮긴다.
 */
export interface StructureElementSelection {
  id: string;
  type: string;
  label: string;
  page: number;
  box_2d: [number, number, number, number];
}
