import type { Node } from '@xyflow/react';

/**
 * 아카이브가 단일 진실 공급원(SSOT)인 본문 필드 목록.
 *
 * 이 값들은 백엔드 스캐폴드 아카이브에 파일로 보관되며, 노드는 포인터(`scaffoldId`)만
 * 들고 있으면 됩니다. 세션 DB/localStorage 에까지 사본을 남기면 아카이브와 갈라지므로
 * 영속화 직전에 떼어냅니다.
 */
const ARCHIVED_BODY_FIELDS = ['htmlContent', 'markdownContent', 'slots', 'archive'] as const;

/** 노드 data 에 아카이브 포인터가 있는지 판정합니다. */
function hasArchivePointer(node: Node): boolean {
  const pointer = (node.data as { scaffoldId?: unknown } | undefined)?.scaffoldId;
  return typeof pointer === 'string' && pointer.length > 0;
}

/**
 * 영속화 대상 노드에서 아카이브가 보유한 본문을 제거합니다.
 *
 * 포인터가 없는 구(舊) 노드는 본문이 유일한 출처이므로 그대로 둡니다.
 */
export function stripArchivedNodeBody<T extends Node>(nodes: T[]): T[] {
  return nodes.map((node) => {
    if (!hasArchivePointer(node)) return node;

    const data = { ...(node.data as Record<string, unknown>) };
    for (const field of ARCHIVED_BODY_FIELDS) {
      delete data[field];
    }
    return { ...node, data } as T;
  });
}
