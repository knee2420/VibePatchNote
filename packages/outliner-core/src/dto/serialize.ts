/**
 * @file serialize.ts
 * @description Workspace -> 파일 텍스트 직렬화 (순수 함수)
 */

import type { Workspace } from '../workspace/model/types';

/** 워크스페이스 전체를 들여쓰기 2칸 JSON 텍스트로 직렬화한다. */
export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}
