import type { Node } from '@xyflow/react';

/**
 * 노드 타입별로 **세션에 남길 필드**를 명시합니다.
 *
 * 캔버스 노드는 다른 애그리거트(문서·아티팩트·스캐폴드)를 **식별자로만 참조**합니다.
 * 본문이나 분석 결과를 값으로 복사해 두면 재분석했을 때 노드·세션·저장소가 갈라지고,
 * 세션 파일이 수백 KB 로 부풉니다.
 *
 * 화이트리스트인 이유: 예전에는 "지울 필드 목록"(블랙리스트)이었는데, 노드 타입에
 * 필드가 하나 늘어날 때마다 조용히 샜습니다. 남길 것을 적으면 새지 않습니다.
 */
const PERSISTED_NODE_DATA_FIELDS: Record<string, readonly string[]> = {
  referenceDocument: [
    'docId',
    'title',
    'url',
    'fileType',
    'size',
    'theme',
    'isOutlineOpen',
    'outlineStatus',
    'outlineError',
    'outlineTraceId',
    'outlineRunId',
    'lastSuccessfulOutlineAt',
  ],
  scaffoldDocument: [
    'id',
    'docId',
    'scaffoldId',
    'sourceNodeId',
    'sourcePdfFileName',
    'title',
    'description',
    'difficulty',
    'status',
    'progressStep',
    'progressMessage',
    'errorMessage',
    'width',
    'height',
    'theme',
  ],
};

/**
 * 아직 화이트리스트가 없는 노드 타입에서 최소한 걸러 내는 파생 필드.
 *
 * 새 노드 타입을 만들면 위 목록에 추가하십시오. 이 폴백은 안전망일 뿐,
 * 규칙 자체가 아닙니다.
 */
const KNOWN_DERIVED_FIELDS = [
  'outlines',
  'elements',
  'segments',
  'htmlContent',
  'markdownContent',
  'slots',
  'archive',
] as const;

function pickData(
  type: string | undefined,
  data: Record<string, unknown>
): Record<string, unknown> {
  const allowed = type ? PERSISTED_NODE_DATA_FIELDS[type] : undefined;

  if (allowed) {
    const kept: Record<string, unknown> = {};
    for (const field of allowed) {
      if (data[field] !== undefined) kept[field] = data[field];
    }
    return kept;
  }

  const kept = { ...data };
  for (const field of KNOWN_DERIVED_FIELDS) {
    delete kept[field];
  }
  return kept;
}

/**
 * 영속화 대상 노드에서 다른 저장소가 정본을 갖는 값을 떼어냅니다.
 *
 * 메모리 상의 노드는 그대로 두고, 디스크/localStorage 로 나가는 사본만 줄입니다.
 */
export function pickPersistedNodeData<T extends Node>(nodes: T[]): T[] {
  return nodes.map((node) => {
    const data = node.data as Record<string, unknown> | undefined;
    if (!data) return node;
    return { ...node, data: pickData(node.type, data) } as T;
  });
}
