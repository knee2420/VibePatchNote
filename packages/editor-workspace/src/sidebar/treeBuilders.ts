import type {
  IdeHierarchyNode,
  IdeSegmentFieldData,
  IdeArboristNodeData,
} from './types';

/** 원본 계층 목차 노드 최소 인터페이스 (scaffold_engine OutlineNode 호환) */
export interface RawOutlineHierarchyItem {
  id: string;
  level?: number;
  title: string;
  page?: number;
  purpose?: string | null;
  children?: RawOutlineHierarchyItem[];
  elements?: Array<{
    id: string;
    label: string;
    type?: string;
    page?: number;
    value?: string;
  }>;
}

/** 원본 물리 세그먼트 블록 최소 인터페이스 */
export interface RawSegmentItem {
  id: string;
  page: number;
  type: string;
  label: string;
  content_summary?: string;
}

/** 슬롯 소켓 최소 인터페이스 */
export interface RawSlotItem {
  id: string;
  number?: number;
  label: string;
  pageNumber?: number;
}

/** 슬롯 바인딩 정보 인터페이스 */
export interface RawSlotBindingInfo {
  currentValue?: string;
  status?: 'unbound' | 'suggested' | 'bound' | 'custom';
  suggestedValue?: string;
  confidence?: string;
  resourceName?: string;
  sourceLocation?: string;
}

/** 세그먼트-엘리먼트 매핑 최소 인터페이스 (백엔드 structure.mappings 호환) */
export interface RawSegmentMappingItem {
  targetKind: string;
  targetId: string;
  primarySegmentId?: string | null;
}

/** 아웃라인 엘리먼트 최소 인터페이스 (백엔드 structure.outlineElements 호환) */
export interface RawOutlineElementItem {
  id: string;
  page?: number;
  label: string;
  type?: string;
}

/**
 * 슬롯 아이템을 IdeSegmentFieldData로 변환하는 헬퍼
 */
export function toSegmentFieldData(
  slot: RawSlotItem,
  binding?: RawSlotBindingInfo
): IdeSegmentFieldData {
  return {
    id: slot.id,
    fieldName: slot.label || `슬롯 #${slot.number ?? slot.id}`,
    fieldKey: slot.id,
    value: binding?.currentValue,
    status: binding?.status || 'unbound',
    suggestedValue: binding?.suggestedValue,
    confidence: binding?.confidence,
    resourceName: binding?.resourceName,
    sourceLocation: binding?.sourceLocation,
  };
}

/**
 * [목차 전담 파츠] buildOutlineHierarchyTree
 * 백엔드 정본 tree.json(H1 -> H2 -> H3)의 중첩 children 구조를 100% 보존하면서
 * IdeHierarchyNode[] 계층 트리로 변환합니다.
 */
export function buildOutlineHierarchyTree(
  rawOutlines: RawOutlineHierarchyItem[],
  slots: RawSlotItem[] = [],
  slotBindings?: Record<string, RawSlotBindingInfo>,
  depth = 0
): IdeHierarchyNode[] {
  if (!rawOutlines || rawOutlines.length === 0) return [];

  return rawOutlines.map((item) => {
    // 1. 하위 자식 노드 재귀 변환 (계층 트리 보존)
    const childNodes = item.children && item.children.length > 0
      ? buildOutlineHierarchyTree(item.children, slots, slotBindings, depth + 1)
      : undefined;

    // 2. 이 목차 항목에 매칭되는 슬롯 탐색 (상태 뱃지 산출용)
    const cleanItemLabel = (item.title || '').replace(/\s+/g, '');
    const matchedSlots = slots.filter((s) => {
      const isSamePage = s.pageNumber === undefined || item.page === undefined || s.pageNumber === item.page;
      if (!isSamePage) return false;
      const cleanSlotLabel = (s.label || '').replace(/\s+/g, '');
      return (
        cleanSlotLabel &&
        cleanItemLabel &&
        (cleanItemLabel.includes(cleanSlotLabel) || cleanSlotLabel.includes(cleanItemLabel))
      );
    });

    const fields = matchedSlots.length > 0
      ? matchedSlots.map((s) => toSegmentFieldData(s, slotBindings?.[s.id]))
      : undefined;

    return {
      id: item.id,
      kind: 'outline',
      title: item.title,
      depth,
      level: item.level || depth + 1,
      pageNumber: item.page,
      fields,
      children: childNodes,
    };
  });
}

/**
 * [세그먼트 전담 파츠] buildSegmentHierarchyTree
 * 물리 세그먼트 블록(segments.json)을 파일 탐색기 형태의 계층 트리(Page -> Block -> Slot)로 빌드합니다.
 * 중복 배속을 차단(1회 고유 배속)하여 깔끔한 컨테이너 구조를 형성합니다.
 */
export function buildSegmentHierarchyTree(
  segments: RawSegmentItem[] = [],
  slots: RawSlotItem[] = [],
  slotBindings?: Record<string, RawSlotBindingInfo>
): IdeHierarchyNode[] {
  // 슬롯 배속 추적 Set (중복 배속 차단)
  const assignedSlotIds = new Set<string>();

  // 1. 페이지 목록 산출 (1-based 정렬)
  const pageSet = new Set<number>();
  for (const seg of segments) {
    if (seg.page) pageSet.add(seg.page);
  }
  for (const slot of slots) {
    if (slot.pageNumber) pageSet.add(slot.pageNumber);
  }
  const pages = Array.from(pageSet).sort((a, b) => a - b);
  if (pages.length === 0) pages.push(1);

  // 2. 페이지별 계층 폴더 노드 구축
  return pages.map((pageNum) => {
    const pageSegments = segments.filter((s) => s.page === pageNum);
    const pageSlots = slots.filter((s) => (s.pageNumber || 1) === pageNum);

    // 페이지 하위 블록 노드들 생성
    const blockNodes: IdeHierarchyNode[] = [];

    for (const seg of pageSegments) {
      // 해당 세그먼트 물리 영역에 속한 슬롯 매칭
      const matchedSlots = pageSlots.filter((slot) => {
        if (assignedSlotIds.has(slot.id)) return false;

        // ID 매칭
        if (slot.id === seg.id || slot.id.includes(seg.id) || seg.id.includes(slot.id)) return true;

        // 라벨 정규화 매칭
        const cleanSlotLabel = (slot.label || '').replace(/\s+/g, '');
        const cleanSegLabel = (seg.label || '').replace(/\s+/g, '');
        if (cleanSlotLabel && cleanSegLabel) {
          return cleanSegLabel.includes(cleanSlotLabel) || cleanSlotLabel.includes(cleanSegLabel);
        }
        return false;
      });

      for (const s of matchedSlots) {
        assignedSlotIds.add(s.id);
      }

      blockNodes.push({
        id: seg.id,
        kind: 'segment',
        title: seg.label || `영역 #${seg.id}`,
        pageNumber: pageNum,
        segmentType: seg.type || 'body',
        fields: matchedSlots.map((s) => toSegmentFieldData(s, slotBindings?.[s.id])),
      });
    }

    // 세그먼트에 배속되지 않은 해당 페이지의 독립 슬롯들
    const remainingSlots = pageSlots.filter((s) => !assignedSlotIds.has(s.id));
    for (const slot of remainingSlots) {
      blockNodes.push({
        id: slot.id,
        kind: 'segment',
        title: slot.label || `서식 슬롯 #${slot.number ?? slot.id}`,
        pageNumber: pageNum,
        segmentType: 'body',
        fields: [toSegmentFieldData(slot, slotBindings?.[slot.id])],
      });
      assignedSlotIds.add(slot.id);
    }

    // 최상위: 페이지 폴더 노드 (Page Folder)
    return {
      id: `page-group-${pageNum}`,
      kind: 'page',
      title: `${pageNum}페이지 (Page ${pageNum})`,
      pageNumber: pageNum,
      children: blockNodes,
    };
  });
}

/**
 * [react-arborist 목차 전담 빌더] buildOutlineArboristTree
 * 백엔드 정본 tree.json(H1 -> H2 -> H3)의 중첩 children 계층 구조를 보존하면서
 * react-arborist가 소비 가능한 IdeArboristNodeData[] 형태로 변환합니다.
 * 각 목차 항목 하위에 매칭된 슬롯이 있을 경우 리프 노드로 하위에 안전하게 연결합니다.
 */
export function buildOutlineArboristTree(
  rawOutlines: RawOutlineHierarchyItem[],
  slots: RawSlotItem[] = [],
  slotBindings?: Record<string, RawSlotBindingInfo>,
  depth = 0
): IdeArboristNodeData[] {
  if (!rawOutlines || rawOutlines.length === 0) return [];

  return rawOutlines.map((item) => {
    // 1. 하위 목차 자식 노드 재귀 변환
    const childOutlineNodes =
      item.children && item.children.length > 0
        ? buildOutlineArboristTree(item.children, slots, slotBindings, depth + 1)
        : [];

    // 2. 이 목차 항목에 매칭되는 슬롯 탐색
    const cleanItemLabel = (item.title || '').replace(/\s+/g, '');
    const matchedSlots = slots.filter((s) => {
      const isSamePage =
        s.pageNumber === undefined || item.page === undefined || s.pageNumber === item.page;
      if (!isSamePage) return false;
      const cleanSlotLabel = (s.label || '').replace(/\s+/g, '');
      return (
        cleanSlotLabel &&
        cleanItemLabel &&
        (cleanItemLabel.includes(cleanSlotLabel) || cleanSlotLabel.includes(cleanItemLabel))
      );
    });

    // 3. 자식 목차가 없고 슬롯이 1개만 매칭된 경우:
    //    불필요한 중복 행(예: "H3 장소" 아래에 또 "회의 장소")을 만들지 않고,
    //    목차 노드 자체에 슬롯 fieldData를 1줄 인라인으로 결합하여 뎁스를 최적화합니다.
    if (childOutlineNodes.length === 0 && matchedSlots.length === 1) {
      const singleSlot = matchedSlots[0]!;
      const binding = slotBindings?.[singleSlot.id];
      const fieldData = toSegmentFieldData(singleSlot, binding);

      return {
        id: item.id,
        name: item.title,
        isInternal: false,
        kind: 'outline' as const,
        level: item.level || depth + 1,
        pageNumber: item.page,
        fieldData,
        badge: undefined, // fieldData 칩이 우측에 렌더링되므로 중복 뱃지 숨김
      };
    }

    // 4. 슬롯이 여러 개 매칭되었거나 하위 목차 자식이 있는 경우:
    const childSlotNodes: IdeArboristNodeData[] = matchedSlots.map((s) => {
      const binding = slotBindings?.[s.id];
      const fieldData = toSegmentFieldData(s, binding);
      return {
        id: `outline-slot-${s.id}`,
        name: s.label || `슬롯 #${s.number ?? s.id}`,
        isInternal: false,
        kind: 'slot' as const,
        pageNumber: s.pageNumber ?? item.page,
        fieldData,
        badge: binding?.currentValue || (binding?.status === 'suggested' ? '추천' : undefined),
      };
    });

    const allChildren = [...childOutlineNodes, ...childSlotNodes];
    const isFolder = allChildren.length > 0;

    return {
      id: item.id,
      name: item.title,
      isInternal: isFolder,
      children: allChildren.length > 0 ? allChildren : undefined,
      kind: 'outline' as const,
      level: item.level || depth + 1,
      pageNumber: item.page,
      badge: item.page ? `${item.page}P` : undefined,
    };
  });
}

/**
 * 슬롯 라벨과 아웃라인 엘리먼트/세그먼트 키워드 간의 스마트 일치 판별기
 */
function isSlotMatchingElement(slotLabel: string, elemLabel: string): boolean {
  const s = (slotLabel || '').replace(/\s+/g, '');
  const e = (elemLabel || '').replace(/\s+/g, '');
  if (!s || !e) return false;
  if (s === e) return true;
  if (s.includes(e) || e.includes(s)) return true;

  // 의미적 핵심 키워드 대조
  const keywords = ['일시', '장소', '참석', '안건', '내용', '지출', '금액', '영수증', '증빙'];
  for (const kw of keywords) {
    if (s.includes(kw) && e.includes(kw)) return true;
  }
  return false;
}

/**
 * [react-arborist 세그먼트 전담 빌더] buildSegmentArboristTree
 * 물리 세그먼트 블록(segments.json)을 파일 탐색기 형태(Page -> Block -> Slot)로 빌드합니다.
 * 백엔드 structure.mappings 및 outlineElements가 제공되면 기하학적 매핑 관계를 복원하여
 * 슬롯을 해당 물리 세그먼트(디렉토리) 하위의 1줄 리프 노드로 정확히 배속합니다.
 */
export function buildSegmentArboristTree(
  segments: RawSegmentItem[] = [],
  slots: RawSlotItem[] = [],
  slotBindings?: Record<string, RawSlotBindingInfo>,
  mappings?: RawSegmentMappingItem[],
  outlineElements?: RawOutlineElementItem[]
): IdeArboristNodeData[] {
  // 슬롯 중복 배속 차단용 Set
  const assignedSlotIds = new Set<string>();

  // 1. 페이지 목록 산출
  const pageSet = new Set<number>();
  for (const seg of segments) {
    if (seg.page) pageSet.add(seg.page);
  }
  for (const slot of slots) {
    if (slot.pageNumber) pageSet.add(slot.pageNumber);
  }
  const pages = Array.from(pageSet).sort((a, b) => a - b);
  if (pages.length === 0) pages.push(1);

  // 2. 페이지 -> 세그먼트(디렉토리) -> 슬롯(리프) 계층 트리 구성
  return pages.map((pageNum) => {
    const pageSegments = segments.filter((s) => s.page === pageNum);
    const pageSlots = slots.filter((s) => (s.pageNumber || 1) === pageNum);

    const segmentFolderNodes: IdeArboristNodeData[] = [];

    for (const seg of pageSegments) {
      const matchedSlots: RawSlotItem[] = [];

      // A. [정본 매핑 테이블 기반 배속]
      // 백엔드 mappings(primarySegmentId === seg.id) ➔ outlineElements(targetId) ➔ slot
      if (mappings && outlineElements) {
        const segMappings = mappings.filter((m) => m.primarySegmentId === seg.id);
        const mappedTargetIds = new Set(segMappings.map((m) => m.targetId));
        const segElements = outlineElements.filter((el) => mappedTargetIds.has(el.id));

        for (const el of segElements) {
          const slot = pageSlots.find(
            (s) => !assignedSlotIds.has(s.id) && isSlotMatchingElement(s.label, el.label)
          );
          if (slot) {
            assignedSlotIds.add(slot.id);
            matchedSlots.push(slot);
          }
        }
      }

      // B. [세그먼트 요약 및 라벨 기반 보조 배속]
      // 예: TABLE 세그먼트의 content_summary에 지출금액, 일시, 장소 등이 명시된 경우
      const segSummary = ((seg as any).content_summary || '').replace(/\s+/g, '');
      const segLabel = (seg.label || '').replace(/\s+/g, '');

      for (const slot of pageSlots) {
        if (assignedSlotIds.has(slot.id)) continue;

        // ID 일치
        if (slot.id === seg.id || slot.id.includes(seg.id) || seg.id.includes(slot.id)) {
          assignedSlotIds.add(slot.id);
          matchedSlots.push(slot);
          continue;
        }

        // 라벨 또는 요약문 기반 매칭
        const cleanSlotLabel = (slot.label || '').replace(/\s+/g, '');
        if (cleanSlotLabel) {
          if (segLabel.includes(cleanSlotLabel) || cleanSlotLabel.includes(segLabel)) {
            assignedSlotIds.add(slot.id);
            matchedSlots.push(slot);
            continue;
          }
          if (segSummary && (segSummary.includes(cleanSlotLabel) || isSlotMatchingElement(cleanSlotLabel, segSummary))) {
            assignedSlotIds.add(slot.id);
            matchedSlots.push(slot);
            continue;
          }
          // "지출금액"이 TABLE(표)에 속해야 하거나 "증빙"이 SECTION에 속해야 하는 컨텍스트 매칭
          if (seg.type === 'table' && (cleanSlotLabel.includes('지출') || cleanSlotLabel.includes('금액'))) {
            assignedSlotIds.add(slot.id);
            matchedSlots.push(slot);
            continue;
          }
          if (segLabel.includes('증빙') && cleanSlotLabel.includes('증빙')) {
            assignedSlotIds.add(slot.id);
            matchedSlots.push(slot);
            continue;
          }
        }
      }

      // 슬롯들을 단일 1줄 리프 노드로 생성
      const slotLeafNodes: IdeArboristNodeData[] = matchedSlots.map((s) => {
        const binding = slotBindings?.[s.id];
        const fieldData = toSegmentFieldData(s, binding);
        return {
          id: s.id,
          name: s.label || `슬롯 #${s.number ?? s.id}`,
          isInternal: false,
          kind: 'slot' as const,
          pageNumber: pageNum,
          fieldData,
          badge: binding?.currentValue || (binding?.status === 'suggested' ? '추천' : undefined),
        };
      });

      // 세그먼트를 디렉토리 폴더로 생성
      segmentFolderNodes.push({
        id: seg.id,
        name: seg.label || `영역 #${seg.id}`,
        isInternal: true,
        kind: 'segment' as const,
        pageNumber: pageNum,
        segmentType: seg.type || 'body',
        badge: slotLeafNodes.length > 0 ? `${slotLeafNodes.length}` : undefined,
        children: slotLeafNodes,
      });
    }

    // 세그먼트에 배속되지 않은 남은 독립 슬롯들
    const remainingSlots = pageSlots.filter((s) => !assignedSlotIds.has(s.id));
    if (remainingSlots.length > 0) {
      const remainingLeafNodes: IdeArboristNodeData[] = remainingSlots.map((slot) => {
        assignedSlotIds.add(slot.id);
        const binding = slotBindings?.[slot.id];
        const fieldData = toSegmentFieldData(slot, binding);
        return {
          id: slot.id,
          name: slot.label || `서식 슬롯 #${slot.number ?? slot.id}`,
          isInternal: false,
          kind: 'slot' as const,
          pageNumber: pageNum,
          fieldData,
          badge: binding?.currentValue || (binding?.status === 'suggested' ? '추천' : undefined),
        };
      });

      // 독립 슬롯이 여러 개면 "기타 슬롯" 폴더로 묶어서 추가
      segmentFolderNodes.push({
        id: `page-${pageNum}-unassigned-slots`,
        name: `기타 슬롯 (${remainingLeafNodes.length})`,
        isInternal: true,
        kind: 'segment' as const,
        pageNumber: pageNum,
        segmentType: 'body',
        children: remainingLeafNodes,
      });
    }

    // 최상위: 페이지 디렉토리 노드
    return {
      id: `page-group-${pageNum}`,
      name: `${pageNum}페이지 (Page ${pageNum})`,
      isInternal: true,
      kind: 'page' as const,
      pageNumber: pageNum,
      badge: `${segmentFolderNodes.length}`,
      children: segmentFolderNodes,
    };
  });
}

/**
 * [react-arborist 파일 트리 전담 빌더] buildFileArboristTree
 * 호스트의 파일 트리 노드들을 react-arborist 규격으로 변환합니다.
 */
export function buildFileArboristTree(
  fileTree: Array<{
    id: string;
    name?: string;
    label?: string;
    isFolder?: boolean;
    children?: any[];
  }> = []
): IdeArboristNodeData[] {
  return fileTree.map((item) => {
    const isInternal = Boolean(item.isFolder);
    const childNodes = item.children && item.children.length > 0
      ? buildFileArboristTree(item.children)
      : undefined;

    return {
      id: item.id,
      name: item.name || item.label || item.id,
      isInternal,
      kind: 'file' as const,
      children: childNodes,
    };
  });
}

