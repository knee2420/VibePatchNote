/**
 * @file exportTypes.ts
 * @description 내보내기의 요청과 결과 계약
 *
 * 내보내는 순간 파일은 이 워크스페이스와 인연이 끊긴다. 파일에는 지금 화면의 내용만 담기고,
 * "어디서 나왔는지"는 남기지 않는다. 결과는 언제나 파일 하나다.
 */

import type { NodeId, ProjectId } from '@vibe/outliner-core';

/** 프로젝트의 어느 범위를 내보낼지 */
export type ExportScope =
  /** 프로젝트 전체 */
  | { kind: 'project' }
  /** 줌인한 불릿의 아래. 그 불릿은 파일 제목이 된다. */
  | { kind: 'subtree'; nodeId: NodeId }
  /** 고른 불릿들과 그 하위 */
  | { kind: 'nodes'; nodeIds: NodeId[] };

export interface ExportRequest {
  projectId: ProjectId;
  scope: ExportScope;
}

/** 내보낼 파일 하나. 미리보기와 실제 저장이 같은 값을 쓴다. */
export interface ExportFile {
  fileName: string;
  text: string;
  title: string;
  nodeCount: number;
}
